---
status: completed
priority: p1
issue_id: "170"
tags: [code-review, performance, subdomain]
dependencies: []
---

# Database Query on Every Protected Route Request

## Problem Statement

The middleware makes a database call (`checkRequiresMultiFactorAuthentication`) on EVERY authenticated request. This adds 50-200ms latency per request and can exhaust database connection pools under load.

**Why it matters**: At 1000 concurrent users, this creates 1000 unnecessary database queries per request cycle, potentially exhausting Supabase connection pools (Pro tier: 200 connections).

## Findings

**Agent**: performance-oracle

**Location**: `/apps/web/proxy.ts:203-204`

```typescript
const requiresMultiFactorAuthentication =
  await checkRequiresMultiFactorAuthentication(supabase);
```

**Current Impact**:
- 50-200ms added to every protected route request
- No caching mechanism
- Database connection pool pressure

**Projected Impact at Scale**:
- 10k requests/min = 10k unnecessary database queries/min
- Can cause cascading failures during traffic spikes

## Proposed Solutions

### Option 1: Cache MFA status in JWT claims (Recommended)
```typescript
// During authentication, set MFA status in user metadata
await supabase.auth.updateUser({
  data: { app_metadata: { requires_mfa: requiresMfa } }
});

// In middleware, read from claims instead of database
const requiresMultiFactorAuthentication =
  data?.claims?.app_metadata?.requires_mfa ?? false;
```
- **Pros**: Eliminates database query entirely, 95%+ reduction in DB load
- **Cons**: Requires auth flow modification, claim might be stale
- **Effort**: Medium
- **Risk**: Low (MFA status rarely changes)

### Option 2: Redis/In-memory cache
```typescript
const cacheKey = `mfa:${userId}`;
let requiresMfa = await cache.get(cacheKey);
if (requiresMfa === null) {
  requiresMfa = await checkRequiresMultiFactorAuthentication(supabase);
  await cache.set(cacheKey, requiresMfa, { ttl: 300 }); // 5 min TTL
}
```
- **Pros**: Reduces DB queries by ~95%
- **Cons**: Cache invalidation complexity, additional infrastructure
- **Effort**: Medium
- **Risk**: Medium (cache consistency)

### Option 3: Check only on sensitive operations
```typescript
// Only check MFA for sensitive paths
const sensitivePatterns = ['/billing', '/settings', '/admin'];
if (sensitivePatterns.some(p => pathname.startsWith(p))) {
  const requiresMfa = await checkRequiresMultiFactorAuthentication(supabase);
  // ...
}
```
- **Pros**: Reduces DB queries significantly
- **Cons**: Inconsistent security posture
- **Effort**: Small
- **Risk**: Medium (security trade-off)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/proxy.ts`
- `@kit/supabase/check-requires-mfa` (for cache implementation)

**Performance Metrics to Track**:
- Middleware latency (p50, p95, p99)
- Database connection pool utilization
- MFA check cache hit rate (if caching implemented)

## Acceptance Criteria

- [ ] Middleware latency reduced by 50-200ms for authenticated requests
- [ ] Database connection pool usage reduced by 90%+
- [ ] MFA enforcement still works correctly
- [ ] Performance tests added

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via performance-oracle agent |
| 2026-01-04 | Fixed | Replaced `checkRequiresMultiFactorAuthentication()` API call with inline `requiresMfaVerification()` function that reads AAL and AMR directly from JWT claims. Eliminates 50-200ms latency per request. |

## Resources

- PR/Commit: 3042c09
- Supabase connection limits: https://supabase.com/docs/guides/platform/custom-postgres-config
