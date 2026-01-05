---
status: pending
priority: p1
issue_id: "142"
tags: [security, dd-mode, rate-limiting, dos-prevention, critical]
dependencies: []
---

# DD Mode v2: Missing Rate Limiting

## Problem Statement

No rate limiting exists on the `report/generate-dd` event trigger. An attacker can trigger unlimited DD reports, causing token/cost exhaustion, API quota depletion, and service degradation for legitimate users.

## Findings

**Location:** Inngest event trigger (no rate limiting found)

**Attack scenario:**
- Attacker triggers 100 DD reports in quick succession
- Each report costs $12-15 in API fees
- Total attack cost: $1,200-1,500
- System becomes unavailable for legitimate users

**Impact:**
- DoS: Exhaust Anthropic API quota
- Financial: $15-75 per report × unlimited reports = unbounded cost
- Service Degradation: Legitimate users blocked

## Proposed Solutions

### Option A: Upstash Rate Limiting (Recommended)
- Use @upstash/ratelimit for sliding window rate limits
- 5 reports per hour per account
- Pros: Simple, proven solution
- Cons: Adds external dependency
- Effort: Low (2-3 hours)
- Risk: Low

### Option B: Database-Based Rate Limiting
- Track report requests in database
- Check count before allowing new request
- Pros: No external dependency
- Cons: Adds database load
- Effort: Medium (4-5 hours)
- Risk: Low

### Option C: Concurrent Report Limiting
- Limit concurrent processing reports per account
- Max 3 reports in "processing" state
- Pros: Simpler, uses existing data
- Cons: Doesn't prevent burst attacks
- Effort: Low (1-2 hours)
- Risk: Low

## Recommended Action

[To be filled during triage]

## Acceptance Criteria

- [ ] Rate limit of 5 reports per hour per account enforced
- [ ] Clear error message when limit exceeded
- [ ] Reset time communicated to user
- [ ] Concurrent report limit (max 3) added
- [ ] Rate limit bypass for admin accounts if needed
- [ ] Monitoring for rate limit hits

## Technical Details

**Affected files:**
- Event trigger endpoint (add rate limiting)
- `apps/web/lib/inngest/functions/generate-dd-report.ts` (add concurrent check)

**Implementation example:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
});

const { success, reset } = await ratelimit.limit(`dd-report:${accountId}`);
if (!success) {
  throw new Error(`Rate limit exceeded. Try again at ${new Date(reset).toLocaleTimeString()}`);
}
```

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 security review
- Analyzed DoS attack vectors
- Proposed rate limiting implementation

**Learnings:**
- Expensive operations must have rate limits
- Both per-hour and concurrent limits needed for full protection
