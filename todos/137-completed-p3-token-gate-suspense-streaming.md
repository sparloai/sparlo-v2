---
status: completed
priority: p3
issue_id: "137"
tags: [code-review, token-gating, performance, streaming]
dependencies: []
---

# Add Suspense Streaming for Token Gate Page

## Problem Statement

The token gate page blocks entirely until usage checks complete (50-150ms). Using React Suspense could stream the page shell immediately, improving perceived performance.

## Findings

**Current behavior:**
- User navigates to /home/reports/new
- Server blocks for 50-150ms checking auth + usage
- Page renders after all checks complete
- TTFB: 50-150ms

**With Suspense:**
- User navigates
- Page shell streams immediately (<10ms)
- Skeleton shown while checks resolve
- Perceived performance: Much faster

## Proposed Solutions

### Solution A: Suspense Wrapper
Wrap content in Suspense with skeleton fallback.

**Pros:** 80-90% TTFB improvement, better perceived performance
**Cons:** Slightly more complex component structure
**Effort:** Small (1-2 hours)
**Risk:** Low

```typescript
// page.tsx
export default async function NewReportPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<PageSkeleton />}>
        <UsageGatedContent prefill={params.prefill} error={params.error} />
      </Suspense>
    </main>
  );
}

async function UsageGatedContent({ prefill, error }: Props) {
  const user = await requireUserInServerComponent();
  const usage = await checkUsageAllowed(user.id, ...);

  if (!usage.allowed) {
    return <TokenGateScreen variant={usage.reason} .../>;
  }

  return <NewAnalysisForm prefill={prefill} error={error} />;
}
```

## Recommended Action

Consider implementing when optimizing page performance.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/new/page.tsx`
- Create: Skeleton component

## Acceptance Criteria

- [ ] Page shell renders in <10ms
- [ ] Skeleton matches final layout
- [ ] No layout shift when content loads
- [ ] Works with both TokenGateScreen and NewAnalysisForm

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-02 | Created from performance review | Nice-to-have optimization |

## Resources

- Performance review finding
- React Suspense docs
