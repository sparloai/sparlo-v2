import 'server-only';

import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

export interface SearchResult {
  title: string;
  content: string;
  slug: string;
  section: string | null;
  score: number;
}

export interface KeywordSearchService {
  searchDocs(query: string, topK?: number): Promise<SearchResult[]>;
}

/**
 * Keyword search service using PostgreSQL full-text search + trigram similarity
 *
 * Accuracy features:
 * 1. Full-text search with stemming (to_tsvector/plainto_tsquery)
 * 2. Weighted ranking (title > section > content)
 * 3. Trigram fuzzy matching for typos
 * 4. Combined scoring for best results
 */
class SupabaseKeywordSearchService implements KeywordSearchService {
  async searchDocs(query: string, topK = 5): Promise<SearchResult[]> {
    const logger = await getLogger();
    const ctx = { name: 'keyword-search', query: query.substring(0, 50), topK };

    try {
      const client = getSupabaseServerClient();

      const { data, error } = await client.rpc('search_help_docs', {
        search_query: query,
        match_count: topK,
        fuzzy_threshold: 0.3,
      });

      if (error) {
        logger.error({ ...ctx, error }, 'Keyword search RPC failed');
        return [];
      }

      logger.info({ ...ctx, matches: data?.length || 0 }, 'Search completed');

      return (data || []).map((row) => ({
        title: row.title || 'Untitled',
        content: row.content || '',
        slug: row.slug || '',
        section: row.section,
        score: row.rank || 0,
      }));
    } catch (error) {
      logger.error({ ...ctx, error }, 'Keyword search failed');
      return [];
    }
  }
}

/**
 * Creates a keyword search service instance
 */
export function createKeywordSearchService(): KeywordSearchService {
  return new SupabaseKeywordSearchService();
}
