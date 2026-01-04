import { z } from 'zod';

import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';

import { createKeywordSearchService } from '~/lib/rag/keyword-search-service';
import { checkRateLimit, getRateLimitHeaders } from '~/lib/security/rate-limit';
import { sanitizeForPrompt } from '~/lib/security/sanitize';

const SearchSchema = z.object({
  query: z.string().min(1).max(500).transform(sanitizeForPrompt),
  topK: z.number().int().min(1).max(20).default(5),
});

export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const logger = await getLogger();
    const ctx = { name: 'api-docs-search', userId: user.id };

    try {
      // Rate limiting
      const rateResult = await checkRateLimit('docsSearch', user.id);
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
      const { query, topK } = SearchSchema.parse(body);

      logger.info(
        { ...ctx, queryLength: query.length, topK },
        'Searching docs',
      );

      // Search
      const searchService = createKeywordSearchService();
      const results = await searchService.searchDocs(query, topK);

      logger.info({ ...ctx, resultCount: results.length }, 'Search completed');

      return new Response(
        JSON.stringify({
          results: results.map((r) => ({
            title: r.title,
            content: r.content,
            slug: r.slug,
            score: r.score,
          })),
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...getRateLimitHeaders(rateResult),
          },
        },
      );
    } catch (error) {
      logger.error({ ...ctx, error }, 'Docs search failed');

      if (error instanceof z.ZodError) {
        return new Response(
          JSON.stringify({ error: 'Invalid request', details: error.errors }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(
        JSON.stringify({ error: 'Search service temporarily unavailable' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  },
  { auth: true },
);
