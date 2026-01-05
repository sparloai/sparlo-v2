---
status: pending
priority: p1
issue_id: "186"
tags: [pdf, docraptor, performance, caching]
dependencies: []
---

# P1: No Server-Side PDF Caching - 93% Latency Reduction Opportunity

## Problem Statement

Every PDF request regenerates the PDF via DocRaptor API call, even for unchanged reports. This wastes:
- Latency: 1-3s per request vs <50ms from cache
- Cost: $0.015 per DocRaptor call
- API quota

Reports are mostly read-only after generation - ideal for caching.

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx:265-267`

Current implementation has ETag generation but no server-side cache:
```typescript
// ETag exists for client caching
const eTag = `"${typedReport.id}-${new Date(updatedAt).getTime()}"`;

// But no server-side cache check before DocRaptor call
const pdfBuffer = await generatePdfFromHtml(html);  // Always calls DocRaptor
```

**Performance impact:**
- Without cache: Every request 1-3s + $0.015
- With cache (95% hit rate): Average 147ms, 95% cost reduction

## Proposed Solutions

### Option 1: Redis/Upstash Cache (Recommended)

Add server-side caching layer keyed by report ID + update timestamp.

```typescript
const cacheKey = `pdf:${id}:${updatedAt}`;

// Check cache first
const cachedPdf = await redis.get(cacheKey);
if (cachedPdf) {
  console.log('[PDF Export] Cache hit');
  return new NextResponse(cachedPdf, { headers: ... });
}

// Cache miss - generate and cache
const pdfBuffer = await generatePdfFromHtml(html);
await redis.set(cacheKey, pdfBuffer, { ex: 86400 }); // 24h TTL
```

**Pros:**
- 93% latency reduction
- 95% cost reduction
- Simple implementation
- Natural cache invalidation via `updated_at`

**Cons:**
- Redis/Upstash dependency
- Storage cost (~500KB per PDF)

**Effort:** Medium (2-4 hours)
**Risk:** Low

### Option 2: Supabase Storage Cache

Store generated PDFs in Supabase Storage bucket.

**Pros:**
- No new infrastructure
- Already have Supabase

**Cons:**
- Slower than Redis for reads
- More complex key management

**Effort:** Medium (3-4 hours)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected files:**
- `apps/web/app/api/reports/[id]/pdf/route.tsx`
- May need new Redis/Upstash client setup

**Cache key strategy:**
- Key: `pdf:{reportId}:{updatedAt.getTime()}`
- TTL: 24 hours
- Invalidation: Automatic via timestamp in key

## Acceptance Criteria

- [ ] Cache client configured (Redis/Upstash)
- [ ] Cache lookup before DocRaptor call
- [ ] Cache write after successful PDF generation
- [ ] Cache key includes report update timestamp
- [ ] 24-hour TTL configured
- [ ] Logging for cache hits/misses
- [ ] Performance test: verify latency improvement

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agent (performance-oracle)

**Actions:**
- Identified missing server-side caching
- Calculated performance/cost impact
- Proposed Redis caching solution

**Learnings:**
- Reports have high read:write ratio - ideal for caching
- ETag already provides natural cache key via `updated_at`
