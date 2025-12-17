---
status: ready
priority: p1
issue_id: "028"
tags: [security, rate-limiting, inngest]
dependencies: []
---

# Add Rate Limiting to Report Generation

No rate limiting on report generation allows resource exhaustion attacks.

## Problem Statement

The `createReport` server action and report generation workflow have no rate limiting. A malicious user could:
- Rapidly create hundreds of reports
- Exhaust LLM API credits (Anthropic billing)
- Overwhelm Inngest queue
- Cause database bloat
- Create denial-of-service condition

**Cost impact:** Each report generation uses ~$2-5 in Claude API calls (15-minute workflow with multiple LLM calls).

## Findings

- File: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- No rate limiting middleware or checks in `createReport` action
- No account-level quotas
- No per-user rate limits
- Inngest has retry mechanisms that could amplify abuse

**Current flow (no protection):**
```
User Request → createReport → Inngest.send → 15-min LLM workflow
(unlimited)    (no check)     (no limit)    ($2-5 per run)
```

## Proposed Solutions

### Option 1: Simple Time-Based Rate Limit (Recommended for MVP)

**Approach:** Check last report creation time before allowing new report.

```typescript
export const createReport = enhanceAction(
  async (data) => {
    const client = getSupabaseServerClient();
    const { data: { user } } = await client.auth.getUser();

    // Rate limit: 1 report per 5 minutes per user
    const { count } = await client
      .from('sparlo_reports')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (count && count >= 1) {
      throw new Error('Rate limit exceeded. Please wait 5 minutes between reports.');
    }

    // Continue with creation...
  }
);
```

**Pros:**
- Simple implementation
- No external dependencies
- Uses existing database

**Cons:**
- Clock-based, can be gamed
- No account-level limits

**Effort:** 1 hour

**Risk:** Low

---

### Option 2: Redis-Based Rate Limiting

**Approach:** Use Upstash Redis for proper sliding window rate limiting.

**Pros:**
- Industry standard approach
- More flexible limits
- Can track multiple dimensions

**Cons:**
- Requires new dependency (Upstash)
- Additional cost
- More complex setup

**Effort:** 3-4 hours

**Risk:** Medium

---

### Option 3: Account-Level Quotas with Subscription Tiers

**Approach:** Monthly quota based on subscription level.

**Pros:**
- Aligns with business model
- Natural upsell path
- Predictable costs

**Cons:**
- More complex implementation
- Requires quota tracking table
- UI for displaying remaining quota

**Effort:** 8+ hours

**Risk:** Medium

## Recommended Action

Implement Option 1 for immediate protection, plan Option 3 for v2:

1. Add 5-minute cooldown between reports per user
2. Add daily limit (e.g., 10 reports/day)
3. Return clear error message with retry time

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

**Suggested limits:**
- Per user: 1 report per 5 minutes
- Per user: 10 reports per day
- Per account: 50 reports per day

## Acceptance Criteria

- [ ] Rate limit check added to `createReport`
- [ ] 5-minute cooldown between reports enforced
- [ ] Daily limit (10/day) enforced
- [ ] Clear error message returned with retry time
- [ ] Test: Rapid requests are blocked
- [ ] Test: Normal usage still works

## Work Log

### 2025-12-16 - Security Review Discovery

**By:** Claude Code (Security Sentinel Agent)

**Actions:**
- Identified missing rate limiting as P1 security issue
- Calculated potential cost impact ($2-5 per report)
- Documented multiple solution approaches

**Learnings:**
- Time-based DB query is simplest approach for MVP
- Account-level quotas align better with SaaS model
- Consider Upstash for production-grade rate limiting
