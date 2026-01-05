# feat: Help Center RAG Knowledge Base Integration

## Overview

Transform the Help Center support bot from a broken, context-less chatbot into a production-quality RAG-powered assistant with proper knowledge base integration, hybrid search, and polished UX.

**Current State**: The chat produces terribly formatted responses with visible system markers, concatenated words, and no useful context because the knowledge base is empty.

**Target State**: A professional support bot that retrieves relevant documentation, provides formatted markdown responses, and gracefully escalates to human support when needed.

## Problem Statement

### Critical Issues Identified

1. **Empty Knowledge Base** - The `help_docs` table is empty; indexing script exists but was never run
2. **Escalation Markers Visible** - `__SYSTEM_ESCALATE_7a8b9c__` appears in responses due to streaming race condition
3. **No Word Spacing** - Streaming chunks concatenate without spaces: "Idon'thavespecificinformation"
4. **No Markdown Rendering** - Bot responses display as raw text, no formatting for code, links, lists
5. **Vector Search Unused** - `docs_embeddings` table exists but no embedding generation implemented

### Root Cause Analysis

```
User asks: "I'm getting an error when I submit a report"
                    ↓
          search_help_docs() RPC
                    ↓
    Returns: [] (empty - no docs indexed)
                    ↓
    Claude gets: "No relevant documentation found"
                    ↓
    Claude hallucinates generic response
                    ↓
    Streaming chunks arrive: ["I", "don't", "have"] → "Idon'thave"
                    ↓
    Escalation marker split across chunks: "__SYSTEM_ESC" + "ALATE_7a8b9c__"
                    ↓
    Regex replace fails on partial marker
                    ↓
    User sees: "Idon'thavespecificinformation__SYSTEM_ESCALATE_7a8b9c__"
```

## Proposed Solution

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Help Center Chat                          │
├─────────────────────────────────────────────────────────────────┤
│  User Message                                                    │
│       ↓                                                          │
│  ┌─────────────────┐                                            │
│  │ Input Sanitizer │ ← PII detection, prompt injection defense  │
│  └────────┬────────┘                                            │
│           ↓                                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │           Hybrid Search (Parallel)                   │        │
│  │  ┌─────────────────┐   ┌──────────────────────┐     │        │
│  │  │ Keyword Search  │   │   Semantic Search    │     │        │
│  │  │ (pg_trgm + FTS) │   │   (pgvector + HNSW)  │     │        │
│  │  └────────┬────────┘   └──────────┬───────────┘     │        │
│  │           │                       │                  │        │
│  │           └───────────┬───────────┘                  │        │
│  │                       ↓                              │        │
│  │              Reciprocal Rank Fusion                  │        │
│  │                  (0.6 semantic + 0.4 keyword)        │        │
│  └───────────────────────┬─────────────────────────────┘        │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Context Builder                         │        │
│  │  • Format top 5 docs with metadata                  │        │
│  │  • Add system prompt with guidelines                │        │
│  │  • Include conversation history (last 10 msgs)      │        │
│  └───────────────────────┬─────────────────────────────┘        │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Claude Sonnet 4                         │        │
│  │  • Streaming response                               │        │
│  │  • Prompt caching for system prompt                 │        │
│  └───────────────────────┬─────────────────────────────┘        │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │           Response Processing                        │        │
│  │  • Buffered marker detection (50 char window)       │        │
│  │  • Auto-escalation on marker detected               │        │
│  │  • Stream to client                                 │        │
│  └───────────────────────┬─────────────────────────────┘        │
│                          ↓                                       │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              Chat UI                                 │        │
│  │  • ReactMarkdown with GFM support                   │        │
│  │  • Code syntax highlighting                         │        │
│  │  • Proper streaming display                         │        │
│  │  • Feedback collection                              │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Approach

### Phase 1: Fix Critical Bugs (Day 1)

#### 1.1 Fix Streaming Word Spacing

**File**: `apps/web/app/home/[account]/help/_components/help-chat.tsx`

**Problem**: Line ~108 concatenates chunks without spacing

```typescript
// Current (broken):
fullResponse += text;

// Fixed:
// Claude should send properly spaced text, but chunks may arrive word-by-word
// Only add space if needed (not before punctuation, not after existing space)
const needsSpace = fullResponse.length > 0 &&
  !fullResponse.endsWith(' ') &&
  !fullResponse.endsWith('\n') &&
  !text.match(/^[.,!?;:)\]]/);

if (needsSpace && text.length > 0 && !text.startsWith(' ')) {
  fullResponse += ' ';
}
fullResponse += text;
```

#### 1.2 Fix Escalation Marker Leaking

**File**: `apps/web/app/api/help/chat/route.ts`

**Problem**: Regex replace on individual chunks fails when marker spans chunks

```typescript
// Current (broken - line 152):
text = cleanEscalationMarkers(text);

// Fixed: Buffer last N chars to catch split markers
const ESCALATION_MARKER = '__SYSTEM_ESCALATE_7a8b9c__';
const MARKER_LENGTH = ESCALATION_MARKER.length;
let buffer = '';
let escalationDetected = false;

for await (const event of responseStream) {
  if (event.type === 'content_block_delta') {
    buffer += event.delta.text;

    // Check if buffer contains full marker
    if (buffer.includes(ESCALATION_MARKER)) {
      escalationDetected = true;
      buffer = buffer.replace(ESCALATION_MARKER, '');
    }

    // Only emit when buffer is safely past marker length
    if (buffer.length > MARKER_LENGTH) {
      const safeToEmit = buffer.slice(0, -MARKER_LENGTH);
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(safeToEmit));
      buffer = buffer.slice(-MARKER_LENGTH);
    }
  }
}

// Emit remaining buffer (cleaned)
if (buffer.length > 0) {
  buffer = buffer.replace(ESCALATION_MARKER, '');
  controller.enqueue(new TextEncoder().encode(buffer));
}

// Auto-escalate if marker was detected
if (escalationDetected) {
  // Create ticket automatically
  await autoCreateEscalationTicket(userId, messages);
}
```

#### 1.3 Add Markdown Rendering

**File**: `apps/web/app/home/[account]/help/_components/help-chat.tsx`

```typescript
// Install: pnpm add react-markdown remark-gfm rehype-sanitize

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

// In ChatBubble component (line ~305):
// Current:
{message.content}

// Fixed:
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeSanitize]}
  className="prose prose-sm max-w-none prose-zinc"
  components={{
    code: ({ inline, className, children }) => {
      if (inline) {
        return <code className="bg-zinc-100 px-1 py-0.5 rounded text-sm">{children}</code>;
      }
      return (
        <pre className="bg-zinc-900 text-zinc-100 p-3 rounded-lg overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    },
    a: ({ href, children }) => (
      <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  }}
>
  {message.content}
</ReactMarkdown>
```

### Phase 2: Populate Knowledge Base (Day 2)

#### 2.1 Create Comprehensive Indexing Script

**File**: `apps/web/scripts/index-help-docs.ts`

```typescript
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DOCS_DIR = path.join(process.cwd(), 'docs');
const CHUNK_SIZE = 1000; // tokens
const CHUNK_OVERLAP = 100;

interface DocChunk {
  slug: string;
  title: string;
  content: string;
  section: string;
  chunk_index: number;
  embedding?: number[];
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

function chunkDocument(content: string, chunkSize: number, overlap: number): string[] {
  const words = content.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;

  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
    i += chunkSize - overlap;
  }

  return chunks;
}

async function indexDocument(filePath: string): Promise<DocChunk[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);

  const relativePath = path.relative(DOCS_DIR, filePath);
  const slug = relativePath.replace(/\.md$/, '').replace(/\//g, '-');
  const section = path.dirname(relativePath).split('/')[0] || 'general';
  const title = frontmatter.title || path.basename(filePath, '.md');

  // Clean markdown
  const cleanedBody = body
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/<[^>]+>/g, '') // Remove HTML
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
    .trim();

  // Chunk if too long
  const chunks = chunkDocument(cleanedBody, CHUNK_SIZE, CHUNK_OVERLAP);

  const docChunks: DocChunk[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];

    // Generate embedding
    const embedding = await generateEmbedding(`${title}\n\n${chunkContent}`);

    docChunks.push({
      slug: chunks.length > 1 ? `${slug}-chunk-${i}` : slug,
      title,
      content: chunkContent,
      section,
      chunk_index: i,
      embedding,
    });

    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return docChunks;
}

async function main() {
  console.log('Starting knowledge base indexing...');

  // Find all markdown files
  const files: string[] = [];
  function walkDir(dir: string) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  walkDir(DOCS_DIR);

  console.log(`Found ${files.length} markdown files`);

  // Clear existing data
  await supabase.from('help_docs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('docs_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Index each file
  let totalChunks = 0;
  for (const file of files) {
    try {
      console.log(`Indexing: ${path.relative(DOCS_DIR, file)}`);
      const chunks = await indexDocument(file);

      // Insert into help_docs (for keyword search)
      const keywordDocs = chunks.map(c => ({
        slug: c.slug,
        title: c.title,
        content: c.content,
        section: c.section,
      }));

      await supabase.from('help_docs').upsert(keywordDocs, { onConflict: 'slug' });

      // Insert into docs_embeddings (for vector search)
      const vectorDocs = chunks.map(c => ({
        slug: c.slug,
        title: c.title,
        content: c.content,
        chunk_index: c.chunk_index,
        embedding: c.embedding,
      }));

      await supabase.from('docs_embeddings').upsert(vectorDocs, { onConflict: 'slug,chunk_index' });

      totalChunks += chunks.length;
    } catch (error) {
      console.error(`Error indexing ${file}:`, error);
    }
  }

  console.log(`\nIndexing complete!`);
  console.log(`Total documents: ${files.length}`);
  console.log(`Total chunks: ${totalChunks}`);
}

main().catch(console.error);
```

#### 2.2 Add Product Documentation

Create essential help docs at `docs/help/`:

```markdown
<!-- docs/help/getting-started.md -->
---
title: Getting Started with Sparlo
section: getting-started
---

# Getting Started with Sparlo

Welcome to Sparlo! This guide will help you get up and running quickly.

## Creating Your First Analysis

1. Click the **+ New Analysis** button in the sidebar
2. Choose your analysis type (Discovery or Deep Dive)
3. Enter the company or topic you want to analyze
4. Click **Generate** and wait for results

## Understanding Report Types

### Discovery Reports
Quick overview analysis for initial research...

### Deep Dive Reports
Comprehensive analysis with detailed insights...
```

### Phase 3: Implement Hybrid Search (Day 3)

#### 3.1 Create Hybrid Search Service

**File**: `apps/web/lib/rag/hybrid-search-service.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SearchResult {
  slug: string;
  title: string;
  content: string;
  section: string;
  score: number;
  source: 'keyword' | 'semantic' | 'both';
}

export async function hybridSearch(
  query: string,
  topK: number = 5
): Promise<SearchResult[]> {
  // Run both searches in parallel
  const [keywordResults, semanticResults] = await Promise.all([
    keywordSearch(query, topK * 2),
    semanticSearch(query, topK * 2),
  ]);

  // Reciprocal Rank Fusion
  const scoreMap = new Map<string, SearchResult>();
  const k = 60; // RRF constant

  // Score keyword results
  keywordResults.forEach((result, rank) => {
    const rrfScore = 1 / (k + rank + 1);
    const existing = scoreMap.get(result.slug);
    if (existing) {
      existing.score += rrfScore * 0.4; // 40% weight for keyword
      existing.source = 'both';
    } else {
      scoreMap.set(result.slug, {
        ...result,
        score: rrfScore * 0.4,
        source: 'keyword',
      });
    }
  });

  // Score semantic results
  semanticResults.forEach((result, rank) => {
    const rrfScore = 1 / (k + rank + 1);
    const existing = scoreMap.get(result.slug);
    if (existing) {
      existing.score += rrfScore * 0.6; // 60% weight for semantic
      existing.source = 'both';
    } else {
      scoreMap.set(result.slug, {
        ...result,
        score: rrfScore * 0.6,
        source: 'semantic',
      });
    }
  });

  // Sort by combined score
  const combined = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return combined;
}

async function keywordSearch(query: string, limit: number) {
  const { data, error } = await supabase.rpc('search_help_docs', {
    search_query: query,
    match_count: limit,
    fuzzy_threshold: 0.3,
  });

  if (error) {
    console.error('Keyword search error:', error);
    return [];
  }

  return data || [];
}

async function semanticSearch(query: string, limit: number) {
  // Generate query embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });
  const queryEmbedding = response.data[0].embedding;

  // Search pgvector
  const { data, error } = await supabase.rpc('match_docs_embeddings', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  });

  if (error) {
    console.error('Semantic search error:', error);
    return [];
  }

  return data || [];
}
```

#### 3.2 Add pgvector Match Function

**Migration**: `apps/web/supabase/migrations/20260105000000_add_semantic_search.sql`

```sql
-- Function to match documents using vector similarity
CREATE OR REPLACE FUNCTION match_docs_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  slug text,
  title text,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    docs_embeddings.slug,
    docs_embeddings.title,
    docs_embeddings.content,
    1 - (docs_embeddings.embedding <=> query_embedding) as similarity
  FROM docs_embeddings
  WHERE 1 - (docs_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY docs_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS docs_embeddings_hnsw_idx
ON docs_embeddings
USING hnsw (embedding vector_cosine_ops);
```

### Phase 4: Improve Response Quality (Day 4)

#### 4.1 Enhance System Prompt

**File**: `apps/web/lib/rag/prompt-builder.ts`

```typescript
export function buildSupportPrompt(
  context: SearchResult[],
  conversationHistory: Message[]
): string {
  const contextDocs = context.length > 0
    ? context.map((doc, i) => `
[Document ${i + 1}: ${doc.title}]
${doc.content}
---`).join('\n')
    : 'No relevant documentation found for this query.';

  return `You are Sparlo's support assistant, helping users with questions about our engineering intelligence platform.

## Your Capabilities
- Answer questions about Sparlo features (reports, analysis, team management)
- Help troubleshoot common issues
- Guide users through workflows
- Explain billing and account features

## Guidelines
1. Be concise and direct - this is a chat interface, not an essay
2. Use markdown formatting for code blocks, lists, and emphasis
3. If the documentation doesn't cover the question, say so honestly
4. For complex issues or account-specific problems, suggest human support
5. Never make up features or capabilities not mentioned in the docs

## Available Documentation
${contextDocs}

## Escalation
If you cannot help the user or they request human support, respond with:
"I'd be happy to connect you with our support team for personalized assistance."
Then add the escalation marker on its own line: __SYSTEM_ESCALATE_7a8b9c__
Include a brief summary of the issue after the marker.

Remember: Be helpful, accurate, and concise.`;
}
```

#### 4.2 Add Response Confidence Scoring

```typescript
// In route.ts - after getting search results
const avgSimilarity = results.reduce((sum, r) => sum + r.score, 0) / results.length;

if (avgSimilarity < 0.5 && results.length > 0) {
  // Low confidence - add caveat to prompt
  systemPrompt += `\n\n[Note: Search results have low relevance scores.
Be extra careful to qualify your answer and suggest human support if unsure.]`;
}

if (results.length === 0) {
  // No results - be very explicit
  systemPrompt += `\n\n[Note: No documentation matches this query.
Answer based on general knowledge but strongly recommend human support for specific issues.]`;
}
```

## Acceptance Criteria

### Functional Requirements
- [ ] Chat responses display with proper word spacing
- [ ] Escalation markers never visible to users
- [ ] Bot responses render markdown (code, links, lists, emphasis)
- [ ] Knowledge base contains 20+ relevant documents
- [ ] Hybrid search returns results for 90%+ of product queries
- [ ] Automatic ticket creation when escalation marker detected
- [ ] Error states show user-friendly messages

### Non-Functional Requirements
- [ ] First response time < 2 seconds
- [ ] Search query time < 200ms (cached after first)
- [ ] Chat works on mobile devices (375px+)
- [ ] Keyboard accessible (Tab, Enter, Escape)
- [ ] Screen reader compatible (ARIA live regions)

### Quality Gates
- [ ] TypeScript compiles without errors
- [ ] Lint passes
- [ ] Existing tests pass
- [ ] Manual testing of all chat flows
- [ ] Security review of markdown sanitization

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Resolution rate (no escalation) | ~5% | >70% |
| User satisfaction (thumbs up) | Unknown | >80% |
| Average response time | ~3s | <2s |
| Search hit rate | 0% | >90% |
| Escalation rate | ~95% | <25% |

## Implementation Checklist

### Day 1: Critical Bug Fixes
- [ ] Fix streaming word spacing in help-chat.tsx
- [ ] Implement buffered marker detection in route.ts
- [ ] Add react-markdown with sanitization
- [ ] Test all fixes locally

### Day 2: Knowledge Base
- [ ] Create comprehensive indexing script
- [ ] Write essential help documentation (20+ pages)
- [ ] Run indexing on cloud database
- [ ] Verify keyword search returns results

### Day 3: Hybrid Search
- [ ] Add OpenAI embedding generation
- [ ] Create pgvector match function (migration)
- [ ] Implement hybrid search service
- [ ] Test semantic + keyword fusion

### Day 4: Polish & Deploy
- [ ] Enhance system prompt
- [ ] Add confidence-based response caveats
- [ ] Implement auto-escalation
- [ ] Deploy to production
- [ ] Monitor and iterate

## Dependencies

- `react-markdown` - Markdown rendering
- `remark-gfm` - GitHub Flavored Markdown support
- `rehype-sanitize` - XSS protection for markdown
- `openai` - Embedding generation (text-embedding-3-small)
- pgvector extension (already enabled in Supabase)

## Cost Estimation

| Component | Monthly Cost |
|-----------|-------------|
| OpenAI Embeddings (indexing) | ~$5 one-time |
| OpenAI Embeddings (queries) | ~$10/month |
| Claude API (responses) | ~$50-100/month |
| Supabase (pgvector) | Included in Pro plan |
| **Total** | ~$60-110/month |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenAI API rate limits | Search fails | Implement retry with exponential backoff |
| Poor search relevance | Bad UX | A/B test chunk sizes, embedding models |
| Markdown XSS | Security breach | Use rehype-sanitize, CSP headers |
| Claude hallucinations | User confusion | Low-confidence warnings, human escalation |
| Cost overruns | Budget impact | Token usage monitoring, caching |

## References

### Internal Files
- Chat UI: `apps/web/app/home/[account]/help/_components/help-chat.tsx`
- Chat API: `apps/web/app/api/help/chat/route.ts`
- Keyword Search: `apps/web/lib/rag/keyword-search-service.ts`
- Prompt Builder: `apps/web/lib/rag/prompt-builder.ts`
- Existing Indexer: `apps/web/scripts/index-docs.ts`

### External Documentation
- [Supabase pgvector Guide](https://supabase.com/docs/guides/ai)
- [Anthropic RAG Best Practices](https://docs.anthropic.com/en/docs/retrieval-augmented-generation)
- [react-markdown](https://github.com/remarkjs/react-markdown)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
