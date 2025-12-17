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
  // Use Opus for complex reasoning (AN0, AN2, AN3)
  OPUS: 'claude-opus-4-5-20251101',
  // Use Sonnet for faster tasks (AN4, AN5, chat)
  SONNET: 'claude-sonnet-4-5-20250514',
} as const;

/**
 * Call Claude with proper error handling
 * (Kieran's fix: every LLM call wrapped with error handling)
 */
export async function callClaude(params: {
  model: (typeof MODELS)[keyof typeof MODELS];
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<string> {
  const anthropic = getAnthropicClient();

  try {
    const response = await anthropic.messages.create({
      model: params.model,
      max_tokens: params.maxTokens ?? 8192,
      system: params.system,
      messages: [{ role: 'user', content: params.userMessage }],
    });

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
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
  // Try to extract JSON from markdown code blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch?.[1]?.trim() ?? response.trim();

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(
      `Failed to parse JSON from ${context}: ${jsonStr.slice(0, 200)}...`,
    );
  }
}
