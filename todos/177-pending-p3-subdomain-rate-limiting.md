---
status: pending
priority: p3
issue_id: "177"
tags: [code-review, security, subdomain]
dependencies: []
---

# Rate Limiting Not Implemented

## Problem Statement

No rate limiting exists on auth callback routes or middleware. This allows potential brute force or denial of service attacks.

**Why it matters**: Without rate limiting, attackers can make unlimited requests to auth endpoints, potentially overwhelming the system or attempting brute force attacks.

## Findings

**Agent**: security-sentinel

**Current State**: Auth routes have no request throttling

**Risk Level**: Medium (lower priority since auth relies on Supabase which has its own rate limiting)

## Proposed Solution

### Add rate limiting middleware

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

// In auth routes
const ip = request.ip ?? '127.0.0.1';
const { success, limit, remaining } = await ratelimit.limit(ip);

if (!success) {
  return new Response('Too many requests', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
    },
  });
}
```

- **Pros**: Prevents brute force and DoS attacks
- **Cons**: Requires Redis/Upstash infrastructure
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/app/auth/callback/route.ts`
- `apps/web/app/auth/confirm/route.ts`
- `apps/web/proxy.ts`

## Acceptance Criteria

- [ ] Rate limiting implemented for auth endpoints
- [ ] Appropriate limits set (balance security vs usability)
- [ ] Rate limit headers returned in responses
- [ ] Logging for rate limit violations

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via security-sentinel agent |

## Resources

- PR/Commit: 3042c09
- Upstash Ratelimit: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview

