import 'server-only';

import Anthropic from '@anthropic-ai/sdk';

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
 * Call Claude with proper error handling
 * Uses streaming for large token requests to avoid timeout issues
 * (Kieran's fix: every LLM call wrapped with error handling)
 */
export async function callClaude(params: {
  model: (typeof MODELS)[keyof typeof MODELS];
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getAnthropicClient();
  const maxTokens = params.maxTokens ?? 8192;

  try {
    // Use streaming for large token requests (>10000) to avoid timeout
    if (maxTokens > 10000) {
      const chunks: string[] = [];

      const stream = anthropic.messages.stream({
        model: params.model,
        max_tokens: maxTokens,
        system: params.system,
        messages: [{ role: 'user', content: params.userMessage }],
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
      if (!result) {
        const finalMessage = await stream.finalMessage();
        throw new Error(
          `No text content from Claude stream. ` +
            `stop_reason: ${finalMessage.stop_reason}, ` +
            `model: ${finalMessage.model}`,
        );
      }

      return result;
    }

    // Non-streaming for smaller requests
    const response = await anthropic.messages.create({
      model: params.model,
      max_tokens: maxTokens,
      system: params.system,
      messages: [{ role: 'user', content: params.userMessage }],
    });

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

    return textBlock.text;
  } catch (error) {
    // Re-throw with context
    if (error instanceof Anthropic.APIError) {
      throw new Error(`Claude API error: ${error.message} (${error.status})`);
    }
    throw error;
  }
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

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(
      `Failed to parse JSON from ${context}: ${jsonStr.slice(0, 200)}...`,
    );
  }
}
