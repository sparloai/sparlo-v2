---
status: pending
priority: p2
issue_id: 207
tags: [code-review, architecture, help-center]
dependencies: []
---

# Vector Embeddings Infrastructure Unused

## Problem Statement

The database has full pgvector setup with embeddings table and search function, but RAG uses keyword search only. This creates over-engineering, maintenance burden, and wasted resources.

## Findings

**Infrastructure present** (migrations):
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE docs_embeddings (
  embedding vector(1024),  -- voyage-3-lite dimension
  -- ...
);
CREATE INDEX idx_docs_embedding USING ivfflat (embedding vector_cosine_ops);
CREATE FUNCTION search_docs(...) -- Semantic search function
```

**Actual usage** (`keyword-search-service.ts`):
```typescript
const { data } = await client.rpc('search_help_docs', { /* ... */ });
// Uses full-text search, NOT vector embeddings
```

**Implications**:
- Paying for pgvector extension (memory overhead)
- Two parallel search systems (vector + keyword)
- Misleading code: `search_docs` function exists but never called
- Wasted migration effort

## Proposed Solutions

### Solution A: Remove Vector Infrastructure (Recommended if keyword works)
**Pros**: Reduces complexity, saves resources
**Cons**: Loses semantic search capability
**Effort**: Medium (1 hour)
**Risk**: Low (no current usage)

Create migration to drop:
- `docs_embeddings` table
- `search_docs` function
- pgvector extension (if no other usage)

### Solution B: Implement Vector Search
**Pros**: Better semantic matching, improved search quality
**Cons**: Requires embedding generation, API integration
**Effort**: Large (1-2 days)
**Risk**: Medium

Implement proper vector search with:
- Embedding generation on doc ingest
- Hybrid search (keyword + semantic)
- Fallback strategy

## Recommended Action

Evaluate search quality:
1. Test keyword search with real queries
2. If quality is good, proceed with Solution A
3. If quality is poor, implement Solution B

## Technical Details

- **Affected Files**:
  - `apps/web/supabase/schemas/` (if removing)
  - `apps/web/lib/rag/` (if implementing)
- **Components**: RAG search, Help Center
- **Database Changes**: Potentially drop tables/extension

## Acceptance Criteria

For Solution A:
- [ ] Migration created to drop vector infrastructure
- [ ] No references to vector search remain
- [ ] Keyword search continues working

For Solution B:
- [ ] Embedding generation implemented
- [ ] Vector search integrated with chat
- [ ] Fallback to keyword on failure

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Architecture review finding |

## Resources

- Agent: architecture-strategist review
