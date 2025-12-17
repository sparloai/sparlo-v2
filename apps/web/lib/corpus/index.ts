export {
  retrieveFromCorpus,
  buildRetrievalQueries,
  formatRetrievalSummary,
  isVectorSearchAvailable,
  type CorpusItem,
  type RetrievalResults,
  type RetrievalConfig,
} from './vector-retrieval';

export {
  searchGooglePatents,
  searchPatentsMultiple,
  isPatentSearchAvailable,
  clearPatentCache,
  getPatentCacheStats,
  type PatentResult,
} from './patent-search';
