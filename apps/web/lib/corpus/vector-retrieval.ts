import 'server-only';

import type {
  Index as PineconeIndexType,
  RecordMetadata,
} from '@pinecone-database/pinecone';
// Import types from the actual SDKs
import type { VoyageAIClient } from 'voyageai';

/**
 * AN1 Corpus Retrieval - Vector Search via Voyage AI + Pinecone (v10)
 *
 * Semantic vector search for cross-domain innovation discovery.
 * Searches 4 namespaces from the Sparlo corpus:
 * - failures: Failure patterns and root causes
 * - bounds: Parameter limits and material constraints
 * - transfers: Cross-domain transfer cases
 * - triz: TRIZ principle applications and examples
 */

// Configuration
const EMBEDDING_MODEL = 'voyage-3-large';
const INDEX_NAME = 'sparlo-corpus';
const DEFAULT_SCORE_THRESHOLD = 0.2;

// Types for v10 4-namespace architecture
export interface CorpusItem {
  id: string;
  relevance_score: number;
  title: string;
  text_preview: string;
  matched_query: string;
  corpus: string;
  [key: string]: unknown;
}

/**
 * v10 Retrieval Results - 4 namespaces
 */
export interface RetrievalResults {
  failures: CorpusItem[];
  bounds: CorpusItem[];
  transfers: CorpusItem[];
  triz: CorpusItem[];
}

export interface RetrievalConfig {
  failuresK?: number;
  boundsK?: number;
  transfersK?: number;
  trizK?: number;
  scoreThreshold?: number;
}

// Singleton clients
let voyageClient: VoyageAIClient | null = null;
let pineconeIndex: PineconeIndexType<RecordMetadata> | null = null;

/**
 * Check if vector search is available (API keys configured)
 */
export function isVectorSearchAvailable(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY && process.env.PINECONE_API_KEY);
}

/**
 * Get or create Voyage AI client
 */
async function getVoyageClient(): Promise<VoyageAIClient> {
  if (!voyageClient) {
    const apiKey = process.env.VOYAGE_API_KEY;
    if (!apiKey) {
      throw new Error('VOYAGE_API_KEY not set in environment');
    }

    // Dynamic import to avoid bundling issues
    const { VoyageAIClient } = await import('voyageai');
    voyageClient = new VoyageAIClient({ apiKey });
  }
  return voyageClient;
}

/**
 * Get or create Pinecone index connection
 */
async function getPineconeIndex(): Promise<PineconeIndexType<RecordMetadata>> {
  if (!pineconeIndex) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY not set in environment');
    }

    // Dynamic import to avoid bundling issues
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pc = new Pinecone({ apiKey });
    pineconeIndex = pc.Index(INDEX_NAME);
  }
  return pineconeIndex;
}

/**
 * Embed query using Voyage AI with asymmetric retrieval
 */
async function embedQuery(query: string): Promise<number[]> {
  const client = await getVoyageClient();

  // Truncate to 30k chars to stay within limits
  const result = await client.embed({
    input: [query.slice(0, 30000)],
    model: EMBEDDING_MODEL,
    inputType: 'query',
  });

  // Response structure: { data: [{ embedding: number[] }] }
  if (!result.data || !result.data[0]?.embedding) {
    throw new Error('Invalid embedding response from Voyage AI');
  }

  return result.data[0].embedding;
}

/**
 * AN1: Retrieve from corpus using vector search (v10)
 *
 * Searches the 4 namespaces:
 * - failures: For validation against failure patterns
 * - bounds: For parameter limits and material constraints
 * - transfers: For cross-domain innovation inspiration
 * - triz: For TRIZ principle application exemplars
 *
 * Searches across all queries and deduplicates results,
 * keeping the highest score for each unique item.
 */
export async function retrieveFromCorpus(
  queries: string[],
  config: RetrievalConfig = {},
): Promise<RetrievalResults> {
  const {
    failuresK = 20,
    boundsK = 20,
    transfersK = 30,
    trizK = 30,
    scoreThreshold = DEFAULT_SCORE_THRESHOLD,
  } = config;

  if (!isVectorSearchAvailable()) {
    console.warn('Vector search not available - returning empty results');
    return { failures: [], bounds: [], transfers: [], triz: [] };
  }

  const index = await getPineconeIndex();

  // v10: 4 namespaces
  const namespaceConfig: Record<string, number> = {
    failures: failuresK,
    bounds: boundsK,
    transfers: transfersK,
    triz: trizK,
  };

  // Collect results across all queries, deduplicate by ID (keep highest score)
  const allResults: Record<string, Map<string, CorpusItem>> = {
    failures: new Map(),
    bounds: new Map(),
    transfers: new Map(),
    triz: new Map(),
  };

  for (const query of queries) {
    if (!query?.trim()) continue;

    const queryEmbedding = await embedQuery(query);

    for (const [namespace, limit] of Object.entries(namespaceConfig)) {
      const nsIndex = index.namespace(namespace);
      const response = await nsIndex.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
      });

      for (const match of response.matches) {
        if (!match.score || match.score < scoreThreshold) continue;

        const entryId = match.id;
        const metadata = match.metadata || {};
        const existing = allResults[namespace]!.get(entryId);

        // Keep highest scoring match for each ID
        if (!existing || match.score > existing.relevance_score) {
          allResults[namespace]!.set(entryId, {
            id: entryId,
            relevance_score: match.score,
            title: (metadata.title as string) || '',
            text_preview: (metadata.text_preview as string) || '',
            matched_query: query,
            corpus: (metadata.corpus as string) || namespace,
            ...Object.fromEntries(
              Object.entries(metadata).filter(
                ([k]) => !['title', 'text_preview', 'corpus'].includes(k),
              ),
            ),
          });
        }
      }
    }
  }

  // Convert to sorted arrays, limited to requested count
  const finalResults: RetrievalResults = {
    failures: [],
    bounds: [],
    transfers: [],
    triz: [],
  };

  for (const [namespace, limit] of Object.entries(namespaceConfig)) {
    const items = Array.from(allResults[namespace]!.values());
    items.sort((a, b) => b.relevance_score - a.relevance_score);
    finalResults[namespace as keyof RetrievalResults] = items.slice(0, limit);
  }

  return finalResults;
}

/**
 * Build retrieval queries from AN0 output (v10 structure)
 *
 * v10 AN0 outputs corpus_queries structured as:
 * - teaching_examples.triz: queries for TRIZ examples
 * - teaching_examples.transfers: queries for cross-domain transfers
 * - validation.failures: queries for failure patterns
 * - validation.bounds: queries for parameter bounds
 */
export function buildRetrievalQueries(an0Analysis: {
  original_ask?: string;
  corpus_queries?: {
    teaching_examples?: {
      triz?: string[];
      transfers?: string[];
    };
    validation?: {
      failures?: string[];
      bounds?: string[];
    };
  };
  cross_domain_seeds?: Array<{
    domain: string;
    similar_challenge: string;
    why_relevant: string;
  }>;
  contradiction?: {
    plain_english?: string;
  };
  web_search_queries?: string[];
}): {
  triz: string[];
  transfers: string[];
  failures: string[];
  bounds: string[];
} {
  const triz: string[] = [];
  const transfers: string[] = [];
  const failures: string[] = [];
  const bounds: string[] = [];

  // Add the original ask to all namespaces as a base query
  if (an0Analysis.original_ask) {
    triz.push(an0Analysis.original_ask);
    transfers.push(an0Analysis.original_ask);
    failures.push(an0Analysis.original_ask);
    bounds.push(an0Analysis.original_ask);
  }

  // Add contradiction description to triz and failures
  if (an0Analysis.contradiction?.plain_english) {
    triz.push(an0Analysis.contradiction.plain_english);
    failures.push(an0Analysis.contradiction.plain_english);
  }

  // Add corpus queries from AN0 v10 structure
  if (an0Analysis.corpus_queries) {
    const { teaching_examples, validation } = an0Analysis.corpus_queries;

    if (teaching_examples?.triz) {
      triz.push(...teaching_examples.triz);
    }
    if (teaching_examples?.transfers) {
      transfers.push(...teaching_examples.transfers);
    }
    if (validation?.failures) {
      failures.push(...validation.failures);
    }
    if (validation?.bounds) {
      bounds.push(...validation.bounds);
    }
  }

  // Add cross-domain seeds to transfers
  if (an0Analysis.cross_domain_seeds) {
    for (const seed of an0Analysis.cross_domain_seeds) {
      if (seed.similar_challenge) {
        transfers.push(seed.similar_challenge);
      }
      if (seed.domain && seed.why_relevant) {
        transfers.push(`${seed.domain}: ${seed.why_relevant}`);
      }
    }
  }

  // Deduplicate and filter empty
  return {
    triz: [...new Set(triz.filter((q) => q?.trim()))],
    transfers: [...new Set(transfers.filter((q) => q?.trim()))],
    failures: [...new Set(failures.filter((q) => q?.trim()))],
    bounds: [...new Set(bounds.filter((q) => q?.trim()))],
  };
}

/**
 * Retrieve from specific namespaces with targeted queries (v10)
 *
 * More efficient than retrieveFromCorpus when you have
 * namespace-specific queries from AN0.
 */
export async function retrieveTargeted(
  queries: {
    triz: string[];
    transfers: string[];
    failures: string[];
    bounds: string[];
  },
  config: RetrievalConfig = {},
): Promise<RetrievalResults> {
  const {
    failuresK = 20,
    boundsK = 20,
    transfersK = 30,
    trizK = 30,
    scoreThreshold = DEFAULT_SCORE_THRESHOLD,
  } = config;

  if (!isVectorSearchAvailable()) {
    console.warn('Vector search not available - returning empty results');
    return { failures: [], bounds: [], transfers: [], triz: [] };
  }

  const index = await getPineconeIndex();

  const namespaceConfig: Record<keyof typeof queries, number> = {
    failures: failuresK,
    bounds: boundsK,
    transfers: transfersK,
    triz: trizK,
  };

  const allResults: Record<string, Map<string, CorpusItem>> = {
    failures: new Map(),
    bounds: new Map(),
    transfers: new Map(),
    triz: new Map(),
  };

  // Search each namespace with its targeted queries
  for (const [namespace, namespaceQueries] of Object.entries(queries)) {
    const limit = namespaceConfig[namespace as keyof typeof namespaceConfig];

    for (const query of namespaceQueries) {
      if (!query?.trim()) continue;

      const queryEmbedding = await embedQuery(query);
      const nsIndex = index.namespace(namespace);
      const response = await nsIndex.query({
        vector: queryEmbedding,
        topK: limit,
        includeMetadata: true,
      });

      for (const match of response.matches) {
        if (!match.score || match.score < scoreThreshold) continue;

        const entryId = match.id;
        const metadata = match.metadata || {};
        const existing = allResults[namespace]!.get(entryId);

        if (!existing || match.score > existing.relevance_score) {
          allResults[namespace]!.set(entryId, {
            id: entryId,
            relevance_score: match.score,
            title: (metadata.title as string) || '',
            text_preview: (metadata.text_preview as string) || '',
            matched_query: query,
            corpus: (metadata.corpus as string) || namespace,
            ...Object.fromEntries(
              Object.entries(metadata).filter(
                ([k]) => !['title', 'text_preview', 'corpus'].includes(k),
              ),
            ),
          });
        }
      }
    }
  }

  // Convert to sorted arrays, limited to requested count
  const finalResults: RetrievalResults = {
    failures: [],
    bounds: [],
    transfers: [],
    triz: [],
  };

  for (const [namespace, limit] of Object.entries(namespaceConfig)) {
    const items = Array.from(allResults[namespace]!.values());
    items.sort((a, b) => b.relevance_score - a.relevance_score);
    finalResults[namespace as keyof RetrievalResults] = items.slice(0, limit);
  }

  return finalResults;
}

/**
 * Format retrieval results summary for logging (v10)
 */
export function formatRetrievalSummary(results: RetrievalResults): string {
  return `Retrieved: ${results.failures.length} failures, ${results.bounds.length} bounds, ${results.transfers.length} transfers, ${results.triz.length} triz`;
}
