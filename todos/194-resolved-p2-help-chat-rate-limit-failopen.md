---
status: resolved
priority: p2
issue_id: 194
tags: [code-review, security, help-chat]
dependencies: []
---

# Rate Limit Fail-Open Design - DoS Risk

## Problem Statement

The rate limiting system "fails open" when encountering errors, allowing unlimited requests if the rate limit check fails.

**Impact:** Financial risk (unlimited Claude API calls), availability degradation, SLA violations.

## Findings

**Location:** `apps/web/lib/security/rate-limit.ts:50-59`

```typescript
if (error) {
  logger.error({ type, identifier, error }, 'Rate limit check failed');
  // Fail open - allow request if rate limiting fails
  return {
    success: true,  // ⚠️ ALLOWS REQUEST
    limit: config.limit,
    remaining: config.limit,
    reset: Date.now() + config.windowMinutes * 60000,
  };
}
```

**Attack Scenario:**
1. Attacker sends 1000 concurrent requests
2. Supabase database becomes overloaded
3. RPC call to `check_rate_limit` times out or errors
4. All 1000 requests bypass rate limiting
5. Each request costs AI tokens ($0.003+ per 1K input tokens)

**Evidence:** Security audit identified CVSS Score 6.2 (Medium)

## Proposed Solutions

### Option A: Fail Closed with Grace Period (Recommended)

**Pros:** Secure by default, allows minimal grace during outage
**Cons:** May block legitimate users during DB issues
**Effort:** Small (1 hour)
**Risk:** Low

```typescript
const FAIL_CLOSED_GRACE = 5; // Allow 5 requests during outage

if (error) {
  logger.error({ type, identifier, error }, 'Rate limit check failed');

  return {
    success: false,  // ⚠️ DENY by default
    limit: FAIL_CLOSED_GRACE,
    remaining: 0,
    reset: Date.now() + 60000, // 1 minute
  };
}
```

### Option B: In-Memory Fallback

**Pros:** Maintains availability during DB issues
**Cons:** Not distributed (per-instance limits)
**Effort:** Medium (2 hours)
**Risk:** Medium

```typescript
import { LRUCache } from 'lru-cache';

const emergencyLimiter = new LRUCache<string, number>({
  max: 10000,
  ttl: 60 * 60 * 1000, // 1 hour
});

if (error) {
  // Fallback to in-memory
  const key = `${type}:${identifier}`;
  const count = emergencyLimiter.get(key) || 0;

  if (count >= config.limit / 2) { // More restrictive in degraded mode
    return { success: false, ... };
  }

  emergencyLimiter.set(key, count + 1);
  return { success: true, remaining: config.limit / 2 - count - 1, ... };
}
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/lib/security/rate-limit.ts` (lines 50-59, 74-83)

## Acceptance Criteria

- [ ] Rate limit check failure denies request by default
- [ ] Grace period allows minimal requests during outage
- [ ] Logging captures all rate limit failures
- [ ] Alert on sustained rate limit failures
- [ ] Load test confirms behavior under DB stress

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from security review | Fail-open in security controls is a classic vulnerability |

## Resources

- Security audit: CVSS 6.2 (Medium)
- Pattern: Circuit breaker pattern
