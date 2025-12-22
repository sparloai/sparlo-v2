import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

/**
 * Custom error for Claude refusals (safety filter triggers)
 */
export class ClaudeRefusalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaudeRefusalError';
  }
}

/**
 * Token usage from Claude API response
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Result from callClaude with usage metrics
 */
export interface ClaudeResult {
  content: string;
  usage: TokenUsage;
}

/**
 * Claude pricing per million tokens (as of Dec 2024)
 * Opus 4.5: $15 input, $75 output
 */
export const CLAUDE_PRICING = {
  'claude-opus-4-5-20251101': {
    inputPerMillion: 15,
    outputPerMillion: 75,
  },
} as const;

/**
 * Calculate cost from token usage
 */
export function calculateCost(
  usage: TokenUsage,
  model: keyof typeof CLAUDE_PRICING,
): number {
  const pricing = CLAUDE_PRICING[model];
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost =
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillion;
  return inputCost + outputCost;
}

/**
 * Anthropic client singleton
 */
let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

/**
 * Model identifiers
 */
export const MODELS = {
  // Use Opus 4.5 for all chain steps
  OPUS: 'claude-opus-4-5-20251101',
} as const;

/**
 * Image attachment for vision processing
 */
export interface ImageAttachment {
  media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  data: string; // base64 encoded
}

/**
 * Call Claude with proper error handling and usage tracking
 * Uses streaming for large token requests to avoid timeout issues
 * Supports vision with optional image attachments
 * Supports prompt caching via cacheablePrefix for cost optimization
 * (Kieran's fix: every LLM call wrapped with error handling)
 */
export async function callClaude(params: {
  model: (typeof MODELS)[keyof typeof MODELS];
  system: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  images?: ImageAttachment[];
  cacheablePrefix?: string;
}): Promise<ClaudeResult> {
  const anthropic = getAnthropicClient();
  const maxTokens = params.maxTokens ?? 8192;
  const temperature = params.temperature ?? 1;

  // Build message content - supports text and images for vision
  // Use Anthropic SDK types for proper type compatibility
  type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  type ContentBlock =
    | { type: 'text'; text: string }
    | {
        type: 'image';
        source: { type: 'base64'; media_type: ImageMediaType; data: string };
      };

  const messageContent: ContentBlock[] = [];

  // Add images first if present (Claude processes them before text)
  if (params.images && params.images.length > 0) {
    for (const image of params.images) {
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.media_type,
          data: image.data,
        },
      });
    }
  }

  // Add text message
  messageContent.push({ type: 'text', text: params.userMessage });

  // Build system parameter - supports caching when prefix is provided
  type SystemBlock =
    | string
    | Array<{
        type: 'text';
        text: string;
        cache_control?: { type: 'ephemeral' };
      }>;

  const systemParam: SystemBlock = params.cacheablePrefix
    ? [
        {
          type: 'text' as const,
          text: params.cacheablePrefix,
          cache_control: { type: 'ephemeral' as const },
        },
        {
          type: 'text' as const,
          text: params.system,
        },
      ]
    : params.system;

  try {
    // Use streaming for large token requests (>10000) to avoid timeout
    if (maxTokens > 10000) {
      const chunks: string[] = [];

      const stream = anthropic.messages.stream({
        model: params.model,
        max_tokens: maxTokens,
        temperature,
        system: systemParam,
        messages: [{ role: 'user', content: messageContent }],
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          chunks.push(event.delta.text);
        }
      }

      const result = chunks.join('');
      const finalMessage = await stream.finalMessage();

      // Check for refusal (safety filter triggered)
      if (finalMessage.stop_reason === 'refusal') {
        throw new ClaudeRefusalError(
          'Your design challenge could not be processed. Please rephrase your ' +
            'question to focus on standard engineering or product design problems. ' +
            'Avoid topics that could be interpreted as harmful or dangerous.',
        );
      }

      if (!result) {
        throw new Error(
          `No text content from Claude stream. ` +
            `stop_reason: ${finalMessage.stop_reason}, ` +
            `model: ${finalMessage.model}`,
        );
      }

      // Extract usage from final message
      const usage: TokenUsage = {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        totalTokens:
          finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
      };

      return { content: result, usage };
    }

    // Non-streaming for smaller requests
    const response = await anthropic.messages.create({
      model: params.model,
      max_tokens: maxTokens,
      temperature,
      system: systemParam,
      messages: [{ role: 'user', content: messageContent }],
    });

    // Check for refusal (safety filter triggered)
    if (response.stop_reason === 'refusal') {
      throw new ClaudeRefusalError(
        'Your design challenge could not be processed. Please rephrase your ' +
          'question to focus on standard engineering or product design problems. ' +
          'Avoid topics that could be interpreted as harmful or dangerous.',
      );
    }

    // Extract text from response with detailed error context
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      const contentTypes = response.content.map((b) => b.type).join(', ');
      throw new Error(
        `No text content in Claude response. ` +
          `stop_reason: ${response.stop_reason}, ` +
          `content_types: [${contentTypes || 'empty'}], ` +
          `model: ${response.model}`,
      );
    }

    // Extract usage from response
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    return { content: textBlock.text, usage };
  } catch (error) {
    // Re-throw ClaudeRefusalError as-is (user-friendly message)
    if (error instanceof ClaudeRefusalError) {
      throw error;
    }
    // Re-throw with context for API errors
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.message} (${error.status})`);
    }
    throw error;
  }
}

/**
 * Attempt to repair truncated JSON by closing unclosed brackets/braces
 * This handles cases where LLM output is cut off mid-response
 */
function repairTruncatedJson(jsonStr: string): string {
  // Count unclosed brackets and braces
  let braces = 0;
  let brackets = 0;
  let inString = false;
  let escapeNext = false;

  for (const char of jsonStr) {
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '[') brackets++;
    else if (char === ']') brackets--;
  }

  // If we're in a string, try to close it
  let repaired = jsonStr;
  if (inString) {
    // Find last complete key-value and truncate there, or just close the string
    repaired = repaired + '"';
  }

  // Close any unclosed brackets/braces
  while (brackets > 0) {
    repaired += ']';
    brackets--;
  }
  while (braces > 0) {
    repaired += '}';
    braces--;
  }

  return repaired;
}

/**
 * Parse JSON from Claude response with proper error handling
 */
export function parseJsonResponse<T>(response: string, context: string): T {
  let jsonStr = response.trim();

  // Try to extract JSON from complete markdown code blocks
  const completeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (completeMatch?.[1]) {
    jsonStr = completeMatch[1].trim();
  } else {
    // Handle incomplete code fence (truncated response - no closing ```)
    const incompleteMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*)/);
    if (incompleteMatch?.[1]) {
      jsonStr = incompleteMatch[1].trim();
    }
  }

  // First attempt: parse as-is
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Second attempt: try to repair truncated JSON
    try {
      const repaired = repairTruncatedJson(jsonStr);
      return JSON.parse(repaired) as T;
    } catch {
      throw new Error(
        `Failed to parse JSON from ${context}: ${jsonStr.slice(0, 200)}...`,
      );
    }
  }
}
