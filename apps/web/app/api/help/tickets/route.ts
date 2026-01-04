import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';

import { createPlainService } from '~/lib/plain/plain-service';
import { validateNoPII } from '~/lib/security/pii-detector';
import { checkRateLimit, getRateLimitHeaders } from '~/lib/security/rate-limit';
import { sanitizeForPrompt } from '~/lib/security/sanitize';

const TicketSchema = z.object({
  subject: z
    .string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200)
    .transform(sanitizeForPrompt),
  description: z
    .string()
    .min(10, 'Please provide more details')
    .max(2000)
    .transform(sanitizeForPrompt),
  category: z.enum(['technical', 'billing', 'general', 'feature-request']),
});

export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const logger = await getLogger();
    const ctx = { name: 'api-tickets', userId: user.id };

    try {
      // Rate limiting
      const rateResult = await checkRateLimit('ticket', user.id);
      if (!rateResult.success) {
        logger.warn(ctx, 'Rate limit exceeded');
        return new Response(
          JSON.stringify({
            error:
              'Rate limit exceeded. You can submit up to 5 tickets per day.',
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
      const data = TicketSchema.parse(body);

      // PII check
      const piiError = validateNoPII(data.description);
      if (piiError) {
        return new Response(JSON.stringify({ error: piiError }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      logger.info({ ...ctx, category: data.category }, 'Creating ticket');

      // Ensure user has email
      const userEmail = user.email;
      if (!userEmail) {
        return new Response(
          JSON.stringify({ error: 'User email is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      // Create ticket
      const service = createPlainService();
      const result = await service.createTicket({
        email: userEmail,
        fullName:
          (user.user_metadata?.full_name as string) ||
          userEmail.split('@')[0] ||
          'User',
        subject: data.subject,
        description: data.description,
        category: data.category,
      });

      logger.info({ ...ctx, threadId: result.threadId }, 'Ticket created');

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
      logger.error({ ...ctx, error }, 'Ticket creation failed');

      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Invalid request', details: error.errors }),
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
