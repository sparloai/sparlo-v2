---
status: ready
priority: p2
issue_id: "051"
tags: [security, rate-limiting, chat, infrastructure]
dependencies: []
---

# In-Memory Rate Limiting Won't Work in Production

## Problem Statement

The chat API endpoint uses an in-memory Map for rate limiting. This doesn't work across multiple server instances in a distributed environment (serverless/load-balanced) and can be bypassed by triggering server restarts.

## Findings

**File:** `/apps/web/app/api/sparlo/chat/route.ts`
**Lines:** 23-81

```typescript
// Current in-memory implementation:
const rateLimits = new Map<
  string,
  { hourCount: number; hourReset: number; dayCount: number; dayReset: number }
>();
```

**Security Review findings:**
- Severity: MEDIUM
- Rate limits reset on server restart
- Ineffective in load-balanced/serverless environments
- Memory leak potential if Map grows unbounded

## Proposed Solutions

### Option 1: Redis-Based Rate Limiting

**Approach:** Use Redis for distributed rate limit storage with TTL keys.

```typescript
import { Redis } from '@upstash/redis';

async function checkRateLimit(userId: string) {
  const hourKey = `rate:${userId}:hour:${Math.floor(Date.now() / 3600000)}`;
  const dayKey = `rate:${userId}:day:${Math.floor(Date.now() / 86400000)}`;

  const [hourCount, dayCount] = await Promise.all([
    redis.incr(hourKey),
    redis.incr(dayKey),
  ]);

  // Set TTL on first increment
  if (hourCount === 1) await redis.expire(hourKey, 3600);
  if (dayCount === 1) await redis.expire(dayKey, 86400);

  return { hourCount, dayCount };
}
```

**Pros:**
- Works across all server instances
- Automatic TTL-based cleanup
- Industry standard approach

**Cons:**
- Requires Redis infrastructure (Upstash)
- Additional dependency

**Effort:** 3-4 hours

**Risk:** Low

---

### Option 2: Supabase-Based Rate Limiting

**Approach:** Use Supabase RPC function with database-stored rate limits.

```sql
CREATE TABLE rate_limits (
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  hour_count INTEGER DEFAULT 0,
  hour_reset TIMESTAMPTZ,
  day_count INTEGER DEFAULT 0,
  day_reset TIMESTAMPTZ,
  PRIMARY KEY (user_id, endpoint)
);

CREATE FUNCTION check_rate_limit(...)
RETURNS JSONB AS $$
  -- Atomic check-and-increment logic
$$ LANGUAGE plpgsql;
```

**Pros:**
- No additional infrastructure
- Uses existing Supabase connection
- Atomic operations

**Cons:**
- Additional DB load per request
- More complex implementation

**Effort:** 4-6 hours

**Risk:** Medium

## Recommended Action

Implement Option 1 (Redis via Upstash) if Redis is already used or planned. Otherwise, implement Option 2 (Supabase) to avoid new infrastructure dependencies.

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts:23-81` - Replace in-memory Map
- Migration needed if using Supabase option

**Related:**
- Issue #044 (chat rate limiting) - related but different scope
- Issue #028 (report generation rate limiting) - similar pattern

## Acceptance Criteria

- [ ] Rate limiting works across multiple server instances
- [ ] Rate limits survive server restarts
- [ ] No memory leak from unbounded growth
- [ ] Rate limit headers returned to clients (X-RateLimit-*)
- [ ] Load test validates distributed behavior

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Security Review Agent)

**Actions:**
- Identified in-memory rate limiting as distributed system weakness
- Evaluated Redis vs Supabase approaches
- Documented impact on production deployments

**Learnings:**
- Stateful data (rate limits, sessions) must use shared storage in distributed systems
- In-memory approaches only valid for single-instance deployments
