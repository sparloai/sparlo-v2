import 'server-only';

import type {
  Index as PineconeIndexType,
  RecordMetadata,
} from '@pinecone-database/pinecone';
// Import types from the actual SDKs
import type { VoyageAIClient } from 'voyageai';

/**
 * AN1 Corpus Retrieval - Vector Search via Voyage AI + Pinecone
 *
 * Semantic vector search for cross-domain innovation discovery.
 * Searches mechanisms, seeds, and patents from the Sparlo corpus.
 */

// Configuration
const EMBEDDING_MODEL = 'voyage-3-large';
const INDEX_NAME = 'sparlo-corpus';
const DEFAULT_SCORE_THRESHOLD = 0.2;

// Types
export interface CorpusItem {
  id: string;
  relevance_score: number;
  title: string;
  text_preview: string;
  matched_query: string;
  corpus: string;
  [key: string]: unknown;
}

export interface RetrievalResults {
  mechanisms: CorpusItem[];
  seeds: CorpusItem[];
  patents: CorpusItem[];
}

export interface RetrievalConfig {
  mechanismsK?: number;
  seedsK?: number;
  patentsK?: number;
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
 * AN1: Retrieve from corpus using vector search
 *
 * Searches across all queries and deduplicates results,
 * keeping the highest score for each unique item.
 */
export async function retrieveFromCorpus(
  queries: string[],
  config: RetrievalConfig = {},
): Promise<RetrievalResults> {
  const {
    mechanismsK = 30,
    seedsK = 40,
    patentsK = 20,
    scoreThreshold = DEFAULT_SCORE_THRESHOLD,
  } = config;

  if (!isVectorSearchAvailable()) {
    console.warn('Vector search not available - returning empty results');
    return { mechanisms: [], seeds: [], patents: [] };
  }

  const index = await getPineconeIndex();

  const namespaceConfig: Record<string, number> = {
    mechanisms: mechanismsK,
    seeds: seedsK,
    patents: patentsK,
  };

  // Collect results across all queries, deduplicate by ID (keep highest score)
  const allResults: Record<string, Map<string, CorpusItem>> = {
    mechanisms: new Map(),
    seeds: new Map(),
    patents: new Map(),
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
    mechanisms: [],
    seeds: [],
    patents: [],
  };

  for (const [namespace, limit] of Object.entries(namespaceConfig)) {
    const items = Array.from(allResults[namespace]!.values());
    items.sort((a, b) => b.relevance_score - a.relevance_score);
    finalResults[namespace as keyof RetrievalResults] = items.slice(0, limit);
  }

  return finalResults;
}

/**
 * Build retrieval queries from AN0 output
 */
export function buildRetrievalQueries(an0Analysis: {
  originalAsk?: string;
  corpusQueries?: {
    failureQueries?: string[];
    feasibilityQueries?: string[];
    transferQueries?: string[];
  };
  crossDomainSeeds?: string[];
  contradiction?: { description?: string };
}): string[] {
  const queries: string[] = [];

  // Add the original ask
  if (an0Analysis.originalAsk) {
    queries.push(an0Analysis.originalAsk);
  }

  // Add contradiction description
  if (an0Analysis.contradiction?.description) {
    queries.push(an0Analysis.contradiction.description);
  }

  // Add corpus queries from AN0
  if (an0Analysis.corpusQueries) {
    const { failureQueries, feasibilityQueries, transferQueries } =
      an0Analysis.corpusQueries;
    if (failureQueries) queries.push(...failureQueries);
    if (feasibilityQueries) queries.push(...feasibilityQueries);
    if (transferQueries) queries.push(...transferQueries);
  }

  // Add cross-domain seeds
  if (an0Analysis.crossDomainSeeds) {
    queries.push(...an0Analysis.crossDomainSeeds);
  }

  // Deduplicate and filter empty
  return [...new Set(queries.filter((q) => q?.trim()))];
}

/**
 * Format retrieval results summary for logging
 */
export function formatRetrievalSummary(results: RetrievalResults): string {
  return `Retrieved: ${results.mechanisms.length} mechanisms, ${results.seeds.length} seeds, ${results.patents.length} patents`;
}
