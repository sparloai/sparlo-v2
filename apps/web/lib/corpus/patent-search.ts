import 'server-only';

/**
 * Patent Search via SerpAPI Google Patents
 *
 * Used by AN1.7 for literature augmentation and gap filling.
 */

// Types
export interface PatentResult {
  title: string;
  patent_number: string;
  assignee: string;
  snippet: string;
  link: string;
  filing_date: string;
  grant_date: string;
}

// Simple in-memory cache (LRU would be better for production)
const patentCache = new Map<string, PatentResult[]>();
const CACHE_MAX_SIZE = 500;

/**
 * Check if patent search is available (SerpAPI configured)
 */
export function isPatentSearchAvailable(): boolean {
  return Boolean(process.env.SERP_API_KEY || process.env.SERPAPI_KEY);
}

/**
 * Get SerpAPI key from environment
 */
function getSerpApiKey(): string | undefined {
  return process.env.SERP_API_KEY || process.env.SERPAPI_KEY;
}

/**
 * Search Google Patents via SerpAPI
 */
export async function searchGooglePatents(
  query: string,
  numResults: number = 5,
): Promise<PatentResult[]> {
  if (!isPatentSearchAvailable()) {
    console.warn('Patent search not available - SERP_API_KEY not set');
    return [];
  }

  const apiKey = getSerpApiKey();
  if (!apiKey) return [];

  // Check cache
  const cacheKey = `${query}:${numResults}`;
  if (patentCache.has(cacheKey)) {
    console.log(`Patent cache hit for: ${query.slice(0, 50)}...`);
    return patentCache.get(cacheKey)!;
  }

  try {
    const url = new URL('https://serpapi.com/search');
    url.searchParams.set('engine', 'google_patents');
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(numResults));
    url.searchParams.set('api_key', apiKey);

    console.log(`Searching Google Patents: ${query.slice(0, 80)}...`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();

    // Parse organic results
    const patents: PatentResult[] = [];
    const organicResults = data.organic_results || [];

    for (const result of organicResults.slice(0, numResults)) {
      patents.push({
        title: result.title || '',
        patent_number: result.patent_id || result.publication_number || '',
        assignee: result.assignee || 'Unknown',
        snippet: result.snippet || '',
        link: result.link || '',
        filing_date: result.filing_date || '',
        grant_date: result.grant_date || '',
      });
    }

    console.log(
      `Found ${patents.length} patents for: ${query.slice(0, 50)}...`,
    );

    // Cache results (with simple LRU eviction)
    if (patentCache.size >= CACHE_MAX_SIZE) {
      const firstKey = patentCache.keys().next().value;
      if (firstKey) patentCache.delete(firstKey);
    }
    patentCache.set(cacheKey, patents);

    return patents;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        console.warn(`Patent search timeout for: ${query.slice(0, 50)}`);
      } else {
        console.warn(
          `Patent search error for '${query.slice(0, 50)}': ${error.message}`,
        );
      }
    }
    return [];
  }
}

/**
 * Search for multiple queries and deduplicate results
 */
export async function searchPatentsMultiple(
  queries: string[],
  numResultsPerQuery: number = 3,
): Promise<PatentResult[]> {
  const allPatents: PatentResult[] = [];
  const seenNumbers = new Set<string>();

  for (const query of queries.slice(0, 5)) {
    // Limit to 5 queries
    const results = await searchGooglePatents(query, numResultsPerQuery);

    for (const patent of results) {
      if (!seenNumbers.has(patent.patent_number)) {
        allPatents.push(patent);
        seenNumbers.add(patent.patent_number);
      }
    }
  }

  return allPatents;
}

/**
 * Clear the patent search cache
 */
export function clearPatentCache(): void {
  patentCache.clear();
  console.log('Patent cache cleared');
}

/**
 * Get cache statistics
 */
export function getPatentCacheStats(): {
  size: number;
  maxSize: number;
} {
  return {
    size: patentCache.size,
    maxSize: CACHE_MAX_SIZE,
  };
}
