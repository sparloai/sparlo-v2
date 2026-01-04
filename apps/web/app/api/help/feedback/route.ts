import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { checkRateLimit, getRateLimitHeaders } from '~/lib/security/rate-limit';
import { sanitizeForPrompt } from '~/lib/security/sanitize';

const FeedbackSchema = z.object({
  messageContent: z.string().min(1).max(10000).transform(sanitizeForPrompt),
  responseContent: z.string().min(1).max(50000).transform(sanitizeForPrompt),
  rating: z.enum(['positive', 'negative']),
  comment: z
    .string()
    .max(1000)
    .optional()
    .transform((val) => (val ? sanitizeForPrompt(val) : undefined)),
});

export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const logger = await getLogger();
    const ctx = { name: 'api-feedback', userId: user.id };

    try {
      // Rate limiting
      const rateResult = await checkRateLimit('feedback', user.id);
      if (!rateResult.success) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again later.',
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

      // Parse request
      const body = await request.json();
      const data = FeedbackSchema.parse(body);

      logger.info({ ...ctx, rating: data.rating }, 'Submitting feedback');

      // Store feedback
      const client = getSupabaseServerClient();
      const { error } = await client.from('chat_feedback').insert({
        user_id: user.id,
        message_content: data.messageContent,
        response_content: data.responseContent,
        rating: data.rating,
        comment: data.comment,
      });

      if (error) {
        // Handle duplicate feedback gracefully
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Feedback already submitted',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          );
        }

        logger.error({ ...ctx, error }, 'Failed to store feedback');
        throw new Error('Failed to submit feedback');
      }

      logger.info(ctx, 'Feedback submitted');

      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateResult),
        },
      });
    } catch (error) {
      logger.error({ ...ctx, error }, 'Feedback submission failed');

      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Invalid request', details: error.errors }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ error: 'An unexpected error occurred' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
  { auth: true },
);
