---
status: completed
priority: p2
issue_id: "165"
tags: [reliability, error-handling, inngest, analytics]
dependencies: []
---

# Promise.all Can Cause Silent Analytics Failures in Inngest

## Problem Statement

Using `Promise.all` for analytics tracking alongside database operations in Inngest functions means that if analytics fails, the entire parallel operation fails silently or throws, potentially masking database errors.

**Why it matters:**
- Database errors could be masked by analytics failures
- Analytics failures shouldn't affect core functionality
- Hard to debug when multiple promises fail together

## Findings

### Architecture Strategist Agent
When `trackReportCompleted()` is called alongside other async operations using `Promise.all`, a failure in analytics (network timeout, PostHog outage) will cause the entire `Promise.all` to reject.

**Evidence:**
```typescript
// Current pattern in generate-*-report.ts files
await Promise.all([
  saveReportToDatabase(report),
  trackReportCompleted({ reportId, ... }),  // If this fails...
]);
// ...entire Promise.all throws, database save status unknown
```

## Proposed Solutions

### Option A: Use Promise.allSettled (Recommended)
**Pros:** Each promise resolves independently, can handle partial failures
**Cons:** Slightly more complex result handling
**Effort:** Low (30 minutes)
**Risk:** Very Low

```typescript
const results = await Promise.allSettled([
  saveReportToDatabase(report),
  trackReportCompleted({ reportId, ... }),
]);

// Check database result (critical)
if (results[0].status === 'rejected') {
  throw results[0].reason;
}

// Log analytics failure (non-critical)
if (results[1].status === 'rejected') {
  console.warn('Analytics tracking failed:', results[1].reason);
}
```

### Option B: Fire-and-forget analytics
**Pros:** Simplest approach
**Cons:** No visibility into failures
**Effort:** Very Low (15 minutes)
**Risk:** Low

```typescript
// Don't await analytics
trackReportCompleted({ reportId, ... }).catch(console.error);
await saveReportToDatabase(report);
```

## Recommended Action

Use Option A (Promise.allSettled) for explicit handling of each promise result.

## Technical Details

**Affected Files:**
- `apps/web/lib/inngest/functions/generate-hybrid-report.ts`
- `apps/web/lib/inngest/functions/generate-discovery-report.ts`
- `apps/web/lib/inngest/functions/generate-dd-report.ts`

## Acceptance Criteria

- [ ] Analytics failures don't block database operations
- [ ] Analytics failures are logged for debugging
- [ ] Database failures still throw appropriately
- [ ] No change to happy-path behavior

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | Parallel operations need careful error isolation |
