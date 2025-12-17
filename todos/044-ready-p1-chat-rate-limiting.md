---
status: ready
priority: p1
issue_id: "044"
tags: [security, rate-limiting, chat, cost-control]
dependencies: []
---

# No Rate Limiting on Chat API - Unlimited AI Costs

## Problem Statement

The chat API endpoint has no rate limiting. A malicious or buggy client can send unlimited requests, causing unbounded Anthropic API costs and potential service degradation.

**Financial Impact:** HIGH - Claude Opus 4.5 is expensive, unlimited calls could be costly.
**Availability Impact:** MEDIUM - Could exhaust API quota affecting all users.

## Findings

- **File:** `apps/web/app/api/sparlo/chat/route.ts`
- No rate limiting middleware or checks
- Each request makes Claude Opus 4.5 call (~$15/1M input tokens)
- `enhanceRouteHandler` with `{ auth: true }` only checks authentication
- No per-user, per-report, or global rate limits

**Attack scenario:**
```bash
# Malicious script
while true; do
  curl -X POST /api/sparlo/chat -d '{"reportId":"...","message":"hi"}'
done
# Result: Unbounded API costs
```

## Proposed Solutions

### Option 1: Simple In-Memory Rate Limit

**Approach:** Use Map to track requests per user, reject if exceeding limit.

```typescript
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 20;  // 20 messages per hour per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(userId) ?? { count: 0, resetAt: now + 3600000 };
  if (now > record.resetAt) {
    record.count = 0;
    record.resetAt = now + 3600000;
  }
  if (record.count >= LIMIT) return false;
  record.count++;
  rateLimits.set(userId, record);
  return true;
}
```

**Pros:**
- Simple, no dependencies
- Fast (in-memory)
- Good enough for single-server

**Cons:**
- Resets on server restart
- Doesn't work with multiple instances
- Memory grows with users

**Effort:** 1 hour

**Risk:** Low

---

### Option 2: Database-Based Rate Limit

**Approach:** Track message counts in `sparlo_reports` or separate table.

**Pros:**
- Persists across restarts
- Works with multiple instances
- Can enforce per-report limits too

**Cons:**
- Extra DB query per request
- Slightly more complex

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 3: Upstash Redis Rate Limiting

**Approach:** Use `@upstash/ratelimit` with serverless Redis.

**Pros:**
- Production-ready, battle-tested
- Works across instances
- Supports sliding windows, fixed windows

**Cons:**
- Adds dependency
- Requires Upstash account
- Monthly cost (~$10-50)

**Effort:** 2 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (in-memory) for immediate protection, plan Option 3 for production:

1. Add in-memory rate limit: 20 messages/hour/user, 100 messages/day/user
2. Return 429 Too Many Requests with retry-after header
3. Log rate limit violations for monitoring
4. Plan migration to Upstash for multi-instance deployment

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts` - Add rate limit check at start

**Rate limit constants:**
```typescript
const RATE_LIMITS = {
  MESSAGES_PER_HOUR: 20,
  MESSAGES_PER_DAY: 100,
  MAX_MESSAGE_LENGTH: 4000,  // Already exists
};
```

## Resources

- **Commit:** `fefb735` (fix: chat API)
- **Upstash docs:** https://upstash.com/docs/oss/sdks/ts/ratelimit/overview

## Acceptance Criteria

- [ ] Rate limit enforced: 20 messages/hour/user
- [ ] Rate limit enforced: 100 messages/day/user
- [ ] Returns 429 with `Retry-After` header when exceeded
- [ ] Rate limit violations logged
- [ ] Test: Exceed limit, verify rejection
- [ ] Frontend shows user-friendly "slow down" message

## Work Log

### 2025-12-17 - Initial Discovery

**By:** Claude Code (Code Review)

**Actions:**
- Identified missing rate limiting during security-sentinel review
- Analyzed cost implications of unbounded API calls
- Documented 3 solution approaches

**Learnings:**
- Claude Opus 4.5 at ~$15/1M input tokens makes this a financial risk
- In-memory rate limiting sufficient for MVP
- Upstash provides good serverless option for scale
