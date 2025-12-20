---
status: completed
priority: p1
issue_id: "075"
tags: [code-review, architecture, security, usage-tracking]
dependencies: ["074"]
---

# TOCTOU Race Condition - Users Can Bypass Limits with Concurrent Requests

## Problem Statement

Time-of-check to time-of-use (TOCTOU) vulnerability exists in the usage check flow. Between checking usage (at request start) and incrementing (hours later after report completes), multiple concurrent requests could all pass the check and push usage far beyond limits.

**Why it matters:** Users at 95% usage can submit 10 reports in parallel, all pass the check, and end up at 245% usage - completely bypassing billing limits.

## Findings

### Evidence from Architecture Review

**File:** `apps/web/app/home/(user)/_lib/server/discovery-reports-server-actions.ts:42-45`

```typescript
// Check usage limits FIRST (before any other checks)
const usage = await checkUsageAllowed(
  user.id,
  USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
);

if (!usage.allowed) {
  throw new Error(...);
}

// ... rate limiting checks ...
// ... create report ...
// ... trigger Inngest (which increments usage LATER - hours later!) ...
```

**Timeline Attack:**
1. User at 95% usage submits 10 reports in parallel
2. All 10 calls to `checkUsageAllowed()` see 95% < 100%, all pass
3. All 10 reports start generating
4. Hours later, all 10 complete and increment usage to 245%
5. User got 10x their entitled reports

## Proposed Solutions

### Solution 1: Reserve Tokens Upfront (Recommended)
**Pros:** Atomic, prevents bypass, accurate accounting
**Cons:** Need to handle cancellation/rollback
**Effort:** Medium (3-4 hours)
**Risk:** Low

```sql
-- New function: reserve_usage
CREATE OR REPLACE FUNCTION reserve_usage(
  p_account_id UUID,
  p_tokens BIGINT
) RETURNS JSONB AS $$
BEGIN
  -- Atomically check AND increment in single operation
  UPDATE usage_periods
  SET tokens_used = tokens_used + p_tokens
  WHERE account_id = p_account_id
    AND status = 'active'
    AND tokens_used + p_tokens <= tokens_limit;  -- Enforce limit in UPDATE

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit_exceeded');
  END IF;

  RETURN jsonb_build_object('allowed', true, 'reserved', p_tokens);
END;
$$;

-- Finalize with actual usage (can be less than reserved)
CREATE OR REPLACE FUNCTION finalize_usage(
  p_account_id UUID,
  p_reserved_tokens BIGINT,
  p_actual_tokens BIGINT
) RETURNS void AS $$
BEGIN
  -- Adjust difference (actual - reserved)
  UPDATE usage_periods
  SET tokens_used = tokens_used + (p_actual_tokens - p_reserved_tokens)
  WHERE account_id = p_account_id AND status = 'active';
END;
$$;
```

### Solution 2: Pessimistic Locking with Advisory Locks
**Pros:** Simpler, uses existing PostgreSQL features
**Cons:** May cause contention, doesn't scale as well
**Effort:** Medium (2-3 hours)
**Risk:** Medium - lock contention

### Solution 3: Optimistic Concurrency with Version Counters
**Pros:** High concurrency, no locks
**Cons:** Complex retry logic, may require multiple attempts
**Effort:** High (4-6 hours)
**Risk:** Medium - complex to implement correctly

## Recommended Action

Solution 1 - Implement token reservation. This is the standard pattern for metered billing systems and provides atomic enforcement at the point of request, not completion.

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/` - New migration for reserve/finalize functions
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- `apps/web/app/home/(user)/_lib/server/discovery-reports-server-actions.ts`
- `apps/web/lib/inngest/functions/generate-report.ts` - Finalize at end

**Flow change:**
1. Server action calls `reserve_usage()` instead of `checkUsageAllowed()`
2. If reservation fails, reject immediately
3. Report generates with reserved quota
4. On completion, call `finalize_usage()` with actual tokens
5. On failure, call `release_usage()` to refund reservation

## Acceptance Criteria

- [ ] Tokens reserved atomically at request time
- [ ] Concurrent requests cannot exceed limit
- [ ] Actual usage finalized after completion
- [ ] Failed/cancelled reports release reserved tokens
- [ ] Unit tests verify race condition is prevented

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From architecture review |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Architecture Review Agent: Identified as HIGH severity (P1)
- Depends on: #074 (usage increment must be implemented first)
