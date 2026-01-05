import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';

import { createPlainService } from '~/lib/plain/plain-service';
import { checkRateLimit, getRateLimitHeaders } from '~/lib/security/rate-limit';
import { sanitizeForPrompt } from '~/lib/security/sanitize';

const EscalateSchema = z.object({
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(10000),
      }),
    )
    .max(20, 'History too long'),
  reason: z
    .string()
    .max(200)
    .optional()
    .transform((val) => (val ? sanitizeForPrompt(val) : undefined)),
});

export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const logger = await getLogger();
    const ctx = { name: 'api-escalate', userId: user.id };

    try {
      // Rate limiting (use ticket rate limit for escalations)
      const rateResult = await checkRateLimit('ticket', user.id);
      if (!rateResult.success) {
        logger.warn(ctx, 'Rate limit exceeded');
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

      // Parse request
      const body = await request.json();
      const data = EscalateSchema.parse(body);

      logger.info(
        { ...ctx, historyLength: data.chatHistory.length },
        'Escalating chat',
      );

      // Ensure user has email
      const userEmail = user.email;
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: 'User email is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Escalate via Plain service
      const service = createPlainService();
      const result = await service.escalateChat({
        email: userEmail,
        fullName:
          (user.user_metadata?.full_name as string) ||
          userEmail.split('@')[0] ||
          'User',
        chatHistory: data.chatHistory,
        reason: data.reason,
      });

      logger.info({ ...ctx, threadId: result.threadId }, 'Chat escalated');

      return new Response(
        JSON.stringify({
          success: true,
          threadId: result.threadId,
        }),
        {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateResult),
          },
        },
      );
    } catch (error) {
      logger.error({ ...ctx, error }, 'Chat escalation failed');

      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request format.',
            ...(process.env.NODE_ENV === 'development' && {
              details: error.errors,
            }),
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (error instanceof Error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
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
