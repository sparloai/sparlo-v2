import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';

import { createKeywordSearchService } from '~/lib/rag/keyword-search-service';
import {
  buildSystemPrompt,
  cleanEscalationMarkers,
} from '~/lib/rag/prompt-builder';
import { validateNoPII } from '~/lib/security/pii-detector';
import { checkRateLimit, getRateLimitHeaders } from '~/lib/security/rate-limit';
import { sanitizeForPrompt } from '~/lib/security/sanitize';

const STREAM_TIMEOUT_MS = 30000;
const MAX_RESPONSE_BYTES = 50000;

const RequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    .transform((val) => sanitizeForPrompt(val)),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(10000).transform(sanitizeForPrompt),
      }),
    )
    .max(20, 'History too long')
    .refine(
      (arr) =>
        arr.every((item, i) => i === 0 || item.role !== arr[i - 1]?.role),
      'History must alternate between user and assistant',
    ),
});

export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const logger = await getLogger();
    const ctx = { name: 'help-chat', userId: user.id };

    try {
      // Rate limiting
      const rateResult = await checkRateLimit('chat', user.id);
      if (!rateResult.success) {
        logger.warn({ ...ctx }, 'Rate limit exceeded');
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again later.',
            retryAfter: rateResult.reset,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...getRateLimitHeaders(rateResult),
            },
          },
        );
      }

      // Parse and validate request
      const body = await request.json();
      const { message, history } = RequestSchema.parse(body);

      // PII check
      const piiError = validateNoPII(message);
      if (piiError) {
        return new Response(JSON.stringify({ error: piiError }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      logger.info(
        { ...ctx, messageLength: message.length },
        'Processing chat request',
      );

      // RAG search with graceful degradation
      let searchResults: Awaited<
        ReturnType<ReturnType<typeof createKeywordSearchService>['searchDocs']>
      > = [];
      try {
        const searchService = createKeywordSearchService();
        searchResults = await searchService.searchDocs(message, 5);
      } catch (error) {
        logger.error(
          { ...ctx, error },
          'Keyword search failed, continuing without context',
        );
        searchResults = [];
      }

      // Build system prompt
      const systemContent = buildSystemPrompt(searchResults);

      // Create Claude stream with timeout
      const client = new Anthropic();

      let stream;
      try {
        stream = await client.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: [
            {
              type: 'text',
              text: systemContent,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: [...history.slice(-10), { role: 'user', content: message }],
        });
      } catch (error) {
        logger.error({ ...ctx, error }, 'Failed to create Claude stream');
        return new Response(
          JSON.stringify({
            error: 'AI service temporarily unavailable. Please try again.',
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Create streaming response with timeout and size limit
      const encoder = new TextEncoder();
      const startTime = Date.now();
      let totalBytes = 0;

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              // Check timeout
              if (Date.now() - startTime > STREAM_TIMEOUT_MS) {
                controller.enqueue(
                  encoder.encode('\n\n[Response timeout - please try again]'),
                );
                break;
              }

              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                let text = event.delta.text;

                // Clean escalation markers before sending to client
                text = cleanEscalationMarkers(text);

                const chunk = encoder.encode(text);
                totalBytes += chunk.length;

                // Check size limit
                if (totalBytes > MAX_RESPONSE_BYTES) {
                  controller.enqueue(
                    encoder.encode('\n\n[Response truncated]'),
                  );
                  break;
                }

                controller.enqueue(chunk);
              }
            }
            controller.close();
          } catch (error) {
            logger.error({ ...ctx, error }, 'Stream processing error');
            controller.error(error);
          }
        },
        cancel() {
          stream.controller.abort();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
          ...getRateLimitHeaders(rateResult),
        },
      });
    } catch (error) {
      logger.error({ ...ctx, error }, 'Chat request failed');

      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Invalid request', details: error.errors }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ error: 'An unexpected error occurred' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }
  },
  { auth: true },
);
