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
  /** Tokens written to cache on first request (cache creation) */
  cacheCreationTokens?: number;
  /** Tokens read from cache (cache hit) */
  cacheReadTokens?: number;
}

/**
 * Result from callClaude with usage metrics
 */
export interface ClaudeResult {
  content: string;
  usage: TokenUsage;
  /** True if response was truncated due to max_tokens limit */
  wasTruncated?: boolean;
}

/**
 * Claude pricing per million tokens (as of Jan 2025)
 * Opus 4.5: $15 input, $75 output
 * Cache: Write 1.25x, Read 0.1x base input price
 *
 * @see https://www.anthropic.com/pricing
 */
export const CLAUDE_PRICING = {
  'claude-opus-4-5-20251101': {
    inputPerMillion: 15,
    outputPerMillion: 75,
    cacheWritePerMillion: 18.75, // 1.25x input price
    cacheReadPerMillion: 1.5, // 0.1x input price (90% savings!)
  },
} as const;

/**
 * Calculate cost from token usage (including cache costs)
 */
export function calculateCost(
  usage: TokenUsage,
  model: keyof typeof CLAUDE_PRICING,
): number {
  const pricing = CLAUDE_PRICING[model];
  const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputPerMillion;
  const outputCost =
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillion;
  const cacheWriteCost =
    ((usage.cacheCreationTokens ?? 0) / 1_000_000) *
    pricing.cacheWritePerMillion;
  const cacheReadCost =
    ((usage.cacheReadTokens ?? 0) / 1_000_000) * pricing.cacheReadPerMillion;
  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

/**
 * Log cache performance metrics for observability
 * Only logs when cache activity occurs (creation or read)
 */
function logCachePerformance(usage: TokenUsage): void {
  const cacheRead = usage.cacheReadTokens ?? 0;
  const cacheWrite = usage.cacheCreationTokens ?? 0;

  // Only log if caching is active
  if (cacheRead === 0 && cacheWrite === 0) return;

  const totalInput = usage.inputTokens + cacheRead;
  const cacheHitRate =
    totalInput > 0 ? ((cacheRead / totalInput) * 100).toFixed(1) : '0.0';

  console.log(
    `[Claude Cache] Hit: ${cacheHitRate}% | ` +
      `Read: ${cacheRead.toLocaleString()} | ` +
      `Write: ${cacheWrite.toLocaleString()} | ` +
      `Input: ${usage.inputTokens.toLocaleString()} | ` +
      `Output: ${usage.outputTokens.toLocaleString()}`,
  );
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
 * PDF attachment for document processing
 */
export interface PDFAttachment {
  media_type: 'application/pdf';
  data: string; // base64 encoded
}

/**
 * Call Claude with proper error handling and usage tracking
 * Uses streaming for large token requests to avoid timeout issues
 * Supports vision with optional image attachments
 * Supports PDF documents with optional document attachments
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
  documents?: PDFAttachment[];
  cacheablePrefix?: string;
}): Promise<ClaudeResult> {
  const anthropic = getAnthropicClient();
  const maxTokens = params.maxTokens ?? 8192;
  const temperature = params.temperature ?? 1;

  // Build message content - supports text, images, and PDF documents
  // Use Anthropic SDK types for proper type compatibility
  type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  type ContentBlock =
    | { type: 'text'; text: string }
    | {
        type: 'image';
        source: { type: 'base64'; media_type: ImageMediaType; data: string };
      }
    | {
        type: 'document';
        source: { type: 'base64'; media_type: 'application/pdf'; data: string };
      };

  const messageContent: ContentBlock[] = [];

  // Add PDF documents first if present (Claude processes them before images and text)
  if (params.documents && params.documents.length > 0) {
    for (const doc of params.documents) {
      messageContent.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: doc.media_type,
          data: doc.data,
        },
      });
    }
  }

  // Add images if present (Claude processes them before text)
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

      // Track if response was truncated
      const wasTruncated = finalMessage.stop_reason === 'max_tokens';

      // Log warning if truncated due to max_tokens
      if (wasTruncated) {
        console.warn(
          `[Claude] Response truncated due to max_tokens limit. ` +
            `Used ${finalMessage.usage.output_tokens}/${maxTokens} tokens. ` +
            `Model: ${finalMessage.model}`,
        );
      }

      if (!result) {
        throw new Error(
          `No text content from Claude stream. ` +
            `stop_reason: ${finalMessage.stop_reason}, ` +
            `model: ${finalMessage.model}`,
        );
      }

      // Extract usage from final message (including cache metrics)
      const usage: TokenUsage = {
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        totalTokens:
          finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
        cacheCreationTokens:
          (finalMessage.usage as { cache_creation_input_tokens?: number })
            .cache_creation_input_tokens ?? 0,
        cacheReadTokens:
          (finalMessage.usage as { cache_read_input_tokens?: number })
            .cache_read_input_tokens ?? 0,
      };

      logCachePerformance(usage);
      return { content: result, usage, wasTruncated };
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

    // Track if response was truncated
    const wasTruncated = response.stop_reason === 'max_tokens';
    if (wasTruncated) {
      console.warn(
        `[Claude] Response truncated due to max_tokens limit. ` +
          `Used ${response.usage.output_tokens}/${maxTokens} tokens. ` +
          `Model: ${response.model}`,
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

    // Extract usage from response (including cache metrics)
    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      cacheCreationTokens:
        (response.usage as { cache_creation_input_tokens?: number })
          .cache_creation_input_tokens ?? 0,
      cacheReadTokens:
        (response.usage as { cache_read_input_tokens?: number })
          .cache_read_input_tokens ?? 0,
    };

    logCachePerformance(usage);
    return { content: textBlock.text, usage, wasTruncated };
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
 * Parse state for JSON repair
 */
interface JsonParseState {
  inString: boolean;
  escapeNext: boolean;
  depth: number;
  openStack: ('{' | '[')[];
}

/**
 * Scan JSON string and return parse state at given position
 */
function getJsonState(jsonStr: string, endPos?: number): JsonParseState {
  const state: JsonParseState = {
    inString: false,
    escapeNext: false,
    depth: 0,
    openStack: [],
  };

  const end = endPos ?? jsonStr.length;
  for (let i = 0; i < end; i++) {
    const char = jsonStr[i];

    if (state.escapeNext) {
      state.escapeNext = false;
      continue;
    }
    if (char === '\\' && state.inString) {
      state.escapeNext = true;
      continue;
    }
    if (char === '"') {
      state.inString = !state.inString;
      continue;
    }
    if (state.inString) continue;

    if (char === '{') {
      state.openStack.push('{');
      state.depth++;
    } else if (char === '[') {
      state.openStack.push('[');
      state.depth++;
    } else if (char === '}') {
      if (
        state.openStack.length > 0 &&
        state.openStack[state.openStack.length - 1] === '{'
      ) {
        state.openStack.pop();
        state.depth--;
      }
    } else if (char === ']') {
      if (
        state.openStack.length > 0 &&
        state.openStack[state.openStack.length - 1] === '['
      ) {
        state.openStack.pop();
        state.depth--;
      }
    }
  }

  return state;
}

/**
 * Find position of last complete value in JSON
 * A complete value is: string, number, boolean, null, or closed object/array
 */
function findLastCompleteValue(jsonStr: string): number {
  let inString = false;
  let escapeNext = false;
  let depth = 0;
  let lastCompletePos = -1;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

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
      if (!inString) {
        // Just closed a string - check if it's a value (not a key)
        // Look ahead to see if followed by : (key) or not (value)
        let j = i + 1;
        while (j < jsonStr.length && /\s/.test(jsonStr[j] ?? '')) j++;
        if (j >= jsonStr.length || jsonStr[j] !== ':') {
          // It's a value, not a key
          if (depth > 0) lastCompletePos = i;
        }
      }
      continue;
    }
    if (inString) continue;

    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      lastCompletePos = i;
    } else if (char === ',' || char === ':') {
      // After comma or colon is typically valid
    } else if (/[0-9.-]/.test(char ?? '')) {
      // Could be a number - scan to end
      let j = i;
      while (j < jsonStr.length && /[0-9.eE\-+]/.test(jsonStr[j] ?? '')) j++;
      if (j > i && depth > 0) {
        lastCompletePos = j - 1;
        i = j - 1;
      }
    } else if (jsonStr.substring(i, i + 4) === 'true') {
      if (depth > 0) lastCompletePos = i + 3;
      i += 3;
    } else if (jsonStr.substring(i, i + 5) === 'false') {
      if (depth > 0) lastCompletePos = i + 4;
      i += 4;
    } else if (jsonStr.substring(i, i + 4) === 'null') {
      if (depth > 0) lastCompletePos = i + 3;
      i += 3;
    }
  }

  return lastCompletePos;
}

/**
 * Attempt to repair truncated JSON by finding last complete structure
 * This handles cases where LLM output is cut off mid-response
 *
 * ANTIFRAGILE DESIGN: Multiple fallback strategies
 * 1. Find last complete value and close from there
 * 2. Find last complete object/array at any depth
 * 3. Progressive truncation until valid
 */
function repairTruncatedJson(jsonStr: string): string {
  const state = getJsonState(jsonStr);

  // If not in a string and balanced, might be valid already
  if (!state.inString && state.depth === 0) {
    return jsonStr;
  }

  // Strategy 1: Find last complete value position
  const lastValuePos = findLastCompleteValue(jsonStr);
  if (lastValuePos > 0) {
    let repaired = jsonStr.substring(0, lastValuePos + 1);

    // Clean up trailing artifacts
    repaired = repaired.replace(/,\s*$/, '');
    repaired = repaired.replace(/:\s*$/, '');
    repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '');
    repaired = repaired.replace(/,\s*"[^"]*"\s*$/, '');

    // Close remaining structures
    const repairState = getJsonState(repaired);
    for (let i = repairState.openStack.length - 1; i >= 0; i--) {
      repaired += repairState.openStack[i] === '{' ? '}' : ']';
    }

    // Try to parse
    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: Progressive truncation - find last valid parse point
  for (let i = jsonStr.length - 1; i > 100; i--) {
    const char = jsonStr[i];
    if (char === '}' || char === ']' || char === '"') {
      let candidate = jsonStr.substring(0, i + 1);

      // Clean trailing commas
      candidate = candidate.replace(/,\s*$/, '');

      // Check state and close
      const candidateState = getJsonState(candidate);
      if (!candidateState.inString) {
        let closed = candidate;
        for (let j = candidateState.openStack.length - 1; j >= 0; j--) {
          closed += candidateState.openStack[j] === '{' ? '}' : ']';
        }

        try {
          JSON.parse(closed);
          return closed;
        } catch {
          // Continue searching
        }
      }
    }
  }

  // Strategy 3: Original simple repair as final fallback
  let repaired = jsonStr;

  // If in string, close it
  if (state.inString) {
    repaired += '"';
  }

  // Remove trailing partial content
  repaired = repaired.replace(/,\s*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"\s*:\s*$/, '');
  repaired = repaired.replace(/,\s*"[^"]*"\s*$/, '');

  // Close all open structures
  const finalState = getJsonState(repaired);
  for (let i = finalState.openStack.length - 1; i >= 0; i--) {
    repaired += finalState.openStack[i] === '{' ? '}' : ']';
  }

  return repaired;
}

/**
 * Aggressively truncate JSON to last complete object/array at depth 0 or 1
 * Used as final fallback when normal repair fails
 */
function aggressiveTruncateJson(jsonStr: string): string {
  let inString = false;
  let escapeNext = false;
  let depth = 0;
  let lastBalancedEnd = -1;
  let lastDepth1End = -1;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

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

    if (char === '{' || char === '[') {
      depth++;
    } else if (char === '}' || char === ']') {
      depth--;
      if (depth === 0) {
        lastBalancedEnd = i;
      } else if (depth === 1) {
        lastDepth1End = i;
      }
    }
  }

  // Prefer depth 0 (complete root object)
  if (lastBalancedEnd > 0) {
    return jsonStr.substring(0, lastBalancedEnd + 1);
  }

  // Fall back to depth 1 and close root
  if (lastDepth1End > 0) {
    const truncated = jsonStr.substring(0, lastDepth1End + 1);
    // Remove trailing comma and close root
    const cleaned = truncated.replace(/,\s*$/, '');
    // Determine if root is object or array
    const firstChar = jsonStr.trim()[0];
    return cleaned + (firstChar === '[' ? ']' : '}');
  }

  return jsonStr;
}

/**
 * Options for JSON parsing with truncation awareness
 */
export interface ParseJsonOptions {
  /** If true, response is known to be truncated (max_tokens hit) */
  wasTruncated?: boolean;
  /** If parsing fails, return this default instead of throwing */
  defaultOnError?: unknown;
}

/**
 * Sanitize control characters inside JSON strings
 * LLMs sometimes output literal newlines/tabs inside string values,
 * which are invalid JSON (they need to be escaped as \n, \t, etc.)
 */
function sanitizeJsonControlChars(jsonStr: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i]!;
    const code = char.charCodeAt(0);

    if (escapeNext) {
      escapeNext = false;
      result += char;
      continue;
    }

    if (char === '\\' && inString) {
      escapeNext = true;
      result += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    // If inside a string and we hit a control character, escape it
    if (inString && code < 32) {
      if (code === 10) {
        result += '\\n'; // newline
      } else if (code === 13) {
        result += '\\r'; // carriage return
      } else if (code === 9) {
        result += '\\t'; // tab
      } else {
        // Other control chars: use unicode escape
        result += '\\u' + code.toString(16).padStart(4, '0');
      }
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Parse JSON from Claude response with proper error handling
 * ANTIFRAGILE: Multiple repair strategies, detailed logging, graceful degradation
 */
export function parseJsonResponse<T>(
  response: string,
  context: string,
  options?: ParseJsonOptions,
): T {
  let jsonStr = response.trim();

  // Log if we know response was truncated
  if (options?.wasTruncated) {
    console.warn(
      `[JSON Parse] ${context}: Response was truncated, attempting repair...`,
    );
  }

  // Try to extract JSON from complete markdown code blocks
  const completeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (completeMatch?.[1]) {
    jsonStr = completeMatch[1].trim();
  } else {
    // Handle incomplete code fence (truncated response - no closing ```)
    const incompleteMatch = jsonStr.match(/^```(?:json)?\s*([\s\S]*)/);
    if (incompleteMatch?.[1]) {
      jsonStr = incompleteMatch[1].trim();
      console.log(
        `[JSON Parse] ${context}: Extracted from incomplete code fence`,
      );
    }
  }

  // Sanitize control characters inside JSON strings (LLMs often output literal newlines)
  jsonStr = sanitizeJsonControlChars(jsonStr);

  // Track which strategy succeeded for logging
  let strategy = 'direct';

  // First attempt: parse as-is
  try {
    const result = JSON.parse(jsonStr) as T;
    if (options?.wasTruncated) {
      console.log(
        `[JSON Parse] ${context}: Parsed truncated response successfully (direct)`,
      );
    }
    return result;
  } catch (firstError) {
    // Second attempt: try to repair truncated JSON
    try {
      const repaired = repairTruncatedJson(jsonStr);
      strategy = 'repair';
      const result = JSON.parse(repaired) as T;
      console.log(
        `[JSON Repair] ${context}: Repaired truncated JSON successfully ` +
          `(original: ${jsonStr.length} chars, repaired: ${repaired.length} chars)`,
      );
      return result;
    } catch (secondError) {
      // Third attempt: aggressive truncation to last valid structure
      try {
        const truncated = aggressiveTruncateJson(jsonStr);
        strategy = 'aggressive';
        const result = JSON.parse(truncated) as T;
        console.log(
          `[JSON Repair] ${context}: Aggressive truncation succeeded ` +
            `(original: ${jsonStr.length} chars, truncated: ${truncated.length} chars)`,
        );
        return result;
      } catch (thirdError) {
        // Fourth attempt: Try to extract ANY valid JSON object from the response
        try {
          // Find the first { and try progressively shorter substrings
          const firstBrace = jsonStr.indexOf('{');
          if (firstBrace >= 0) {
            for (
              let endPos = jsonStr.length;
              endPos > firstBrace + 100;
              endPos -= 50
            ) {
              const slice = jsonStr.substring(firstBrace, endPos);
              const repaired = repairTruncatedJson(slice);
              try {
                const result = JSON.parse(repaired) as T;
                strategy = 'progressive';
                console.log(
                  `[JSON Repair] ${context}: Progressive repair succeeded at offset ${endPos}`,
                );
                return result;
              } catch {
                // Continue searching
              }
            }
          }
          throw thirdError; // Re-throw to hit the error handler below
        } catch {
          // All strategies failed

          // If a default was provided, return it
          if (options?.defaultOnError !== undefined) {
            console.error(
              `[JSON Parse] ${context}: All repair strategies failed, returning default`,
            );
            return options.defaultOnError as T;
          }

          // Log detailed error info
          console.error(`[JSON Parse Error] ${context}:`, {
            wasTruncated: options?.wasTruncated ?? false,
            originalLength: response.length,
            extractedLength: jsonStr.length,
            strategy,
            firstError:
              firstError instanceof Error
                ? firstError.message
                : String(firstError),
            secondError:
              secondError instanceof Error
                ? secondError.message
                : String(secondError),
            thirdError:
              thirdError instanceof Error
                ? thirdError.message
                : String(thirdError),
            preview: jsonStr.slice(0, 500),
            ending: jsonStr.slice(-200),
          });

          throw new Error(
            `Failed to parse JSON from ${context}: ${jsonStr.slice(0, 200)}...`,
          );
        }
      }
    }
  }
}
