# Antifragile Token Usage Tracking System

## Enhancement Summary

**Deepened on:** 2026-01-07
**Sections enhanced:** 12
**Research agents used:** security-sentinel, data-integrity-guardian, performance-oracle, architecture-strategist, code-simplicity-reviewer, kieran-typescript-reviewer, data-migration-expert, deployment-verification-agent

### Key Improvements
1. **Simplified Architecture**: Multiple reviewers recommend eliminating reservation system for soft launch (80% LOC reduction)
2. **Critical Security Fixes**: Foreign keys, RLS policies, and admin authorization checks required
3. **Performance Optimizations**: Advisory locks instead of FOR UPDATE, batch inserts instead of per-step writes

### New Considerations Discovered
- Existing `reserve_usage()` / `finalize_usage()` / `release_usage()` functions already exist but aren't consistently used
- Current `complete_dd_report_atomic()` is sufficient for soft launch with minor hardening
- Reservation system solves problems you don't yet have at soft launch scale

---

## Overview

Design an antifragile token usage tracking system that accurately bills users for actual token consumption, handles cancellations and failures gracefully, and prevents gaming through concurrent report attempts.

**Timeline**: Soft launch by Friday (minimal debugging, robust foundation)

---

## Current System Analysis

### How It Works Now

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PRE-FLIGHT CHECK (Server Action)                            │
│     checkUsageAllowed(accountId, estimatedTokens)               │
│     → Returns allowed/blocked based on current balance          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. INNGEST FUNCTION (7 steps for standard reports)             │
│     Each step calls Claude, accumulates usage in memory:        │
│     let totalUsage = { inputTokens: 0, outputTokens: 0, ... }   │
│     → Token usage lives ONLY in memory during execution         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼ (ONLY if ALL steps succeed)
┌─────────────────────────────────────────────────────────────────┐
│  3. COMPLETION (Final step)                                     │
│     increment_usage(accountId, totalUsage.totalTokens)          │
│     → Single database write at the very end                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql` | `usage_periods` table, `increment_usage()` RPC |
| `apps/web/supabase/migrations/20260103000002_dd_mode_token_usage_events.sql` | Idempotency tracking for DD mode |
| `apps/web/supabase/migrations/20260103000004_dd_mode_complete_report_atomic.sql` | Atomic completion for DD mode only |
| `apps/web/lib/inngest/functions/generate-report.ts` | Standard report generation (lines 669-687 for usage tracking) |
| `apps/web/lib/inngest/functions/generate-dd-report.ts` | DD mode with atomic completion |
| `apps/web/app/app/_lib/server/usage.service.ts` | Pre-flight usage checks |
| `apps/web/lib/usage/constants.ts` | Token limits, thresholds |

### Research Insight: Existing TOCTOU Protection

**From `docs/solutions/security/usage-tracking-security-hardening.md`:**

You already have a reserve/finalize/release pattern implemented:

```sql
-- Step 1: Reserve before operation
SELECT reserve_usage(account_id, estimated_tokens);

-- Step 2: Run expensive operation
-- ...

-- Step 3a: Finalize on success
SELECT finalize_usage(reservation_id, actual_tokens);

-- Step 3b: Release on failure
SELECT release_usage(reservation_id);
```

**These functions exist in migration `20251219232541_fix-usage-tracking-security.sql` but are NOT consistently used in Inngest functions.**

### Current Problems

| Problem | Impact | Example |
|---------|--------|---------|
| **All-or-nothing billing** | Lost revenue on failures/cancellations | User cancels at step 4/7 → 0 tokens billed, but ~400K consumed |
| **No reservation system** | Gaming possible | User with 180K tokens starts 3 reports simultaneously |
| **Memory-only tracking** | Data loss on crash | Inngest crashes at step 6 → usage lost |
| **Inconsistent idempotency** | DD mode protected, others aren't | Standard report retries could double-bill |

---

## Your Questions Answered

### Q1: Can each Inngest step track tokens used and pass to database?

**Yes, and it's straightforward.** Inngest's step memoization means each `step.run()` result is persisted automatically. We just need to add a database write after each LLM call:

```typescript
// Current (memory only)
const an0Result = await step.run('an0-problem-framing', async () => {
  const { content, usage } = await callClaude({ ... });
  return { result: validated, usage };  // usage stays in memory
});

// Proposed (persist immediately)
const an0Result = await step.run('an0-problem-framing', async () => {
  const { content, usage } = await callClaude({ ... });

  // NEW: Persist usage immediately
  await persistStepUsage(reportId, 'an0', usage);

  return { result: validated, usage };
});
```

**Complexity**: Low. Add ~5 lines per step.

### Research Insight: Inngest Step Memoization

**From Context7 Inngest documentation:**

> When a Call Request is received, the SDK executes the function. If steps are encountered, they are reported back to the Inngest Server. The server then manages the execution of these steps in subsequent Call Requests, **memoizing results to ensure determinism**.

This means:
- Step results persist across retries automatically
- If step 3 fails and Inngest retries, steps 1-2 won't re-execute
- Token usage recorded in step results survives crashes

### Q2: If there's an error and the report fails, should tokens be refunded?

**Recommendation: Don't auto-refund. Handle via customer service.**

**Why:**
1. **Complexity**: Auto-refund requires determining fault (system error vs user error vs LLM issue)
2. **Risk**: Bugs in refund logic could give away tokens incorrectly
3. **Reality**: For soft launch, you'll have few failures and can handle manually
4. **Implementation**: You already have `token_limit_adjustments` table with admin RPCs

**What to implement instead:**
- Bill for completed steps (accurate, fair)
- Log all failures with token counts for easy CS lookup
- Admin can adjust via existing `adjust_usage_period_limit()` RPC

**Future consideration**: After launch, analyze failure patterns and automate obvious cases (e.g., 500 errors within first 10 seconds = full refund).

### Research Insight: Security Review Finding

**From security-sentinel agent:**

> The `adjust_usage_period_limit()` and `admin_search_users_by_email()` functions are `SECURITY DEFINER` but **lack super admin verification**.

**Fix Required** (add to migration):
```sql
-- At start of adjust_usage_period_limit function:
IF NOT public.is_super_admin() THEN
  RAISE EXCEPTION 'Unauthorized: super admin access required';
END IF;
```

### Q3: Can we prevent gaming when users run multiple reports simultaneously?

**Yes, with a simple reservation system.**

**The problem:**
```
User has 180K tokens (enough for 1 report)
T+0ms: Request A arrives, checks balance (180K ≥ 180K) ✓
T+1ms: Request B arrives, checks balance (180K ≥ 180K) ✓
T+2ms: Request C arrives, checks balance (180K ≥ 180K) ✓
All 3 reports start, only 1 can be paid for
```

### Research Insight: Architecture Review - Simpler Alternative

**From architecture-strategist agent:**

> The reservation system is **premature optimization** for soft launch. At your scale (~50-100 concurrent users, ~10-20 reports/hour), the likelihood of concurrent racing is low.

**Simpler Solution: Hard Cap in `complete_dd_report_atomic`**

```sql
-- In complete_dd_report_atomic, before billing:
IF (SELECT tokens_used + p_total_tokens FROM usage_periods
    WHERE account_id = p_account_id AND status = 'active')
   > (SELECT tokens_limit * 1.1 FROM usage_periods
      WHERE account_id = p_account_id AND status = 'active')
THEN
  -- Allow 10% overage grace, but hard-fail beyond that
  RETURN jsonb_build_object('success', false, 'error', 'Usage limit exceeded');
END IF;
```

**This handles 99% of cases without reservation complexity.**

---

## Proposed Architecture

### Research Insight: Simplicity Review - 80% LOC Reduction

**From code-simplicity-reviewer agent:**

| Metric | Full Proposal | Simplified |
|--------|---------------|------------|
| New tables | 2 | 1 |
| New functions | 3 | 1 |
| New Inngest functions | 2 | 0 |
| Lines of code | ~325 | ~65 |
| Debugging surface | Large | Minimal |

**Recommendation: Implement simplified version for soft launch.**

### Option A: Full System (Original Plan) - DEFERRED

```
┌─────────────────────────────────────────────────────────────────┐
│  1. RESERVATION (Server Action - NEW)                           │
│     try_reserve_tokens(accountId, reportId, 180000)             │
│     → Atomically checks balance AND active reservations         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. INNGEST FUNCTION (7 steps)                                  │
│     Each step persists usage to report_step_usage table         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. COMPLETION/FAILURE/CANCEL                                   │
│     finalize_report_usage(reportId) - sums + bills + releases   │
└─────────────────────────────────────────────────────────────────┘
```

**Defer this until:** >5% of reports hit overage limits, or concurrent gaming becomes a measurable problem.

### Option B: Simplified System (RECOMMENDED FOR SOFT LAUNCH)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PRE-FLIGHT CHECK (Existing)                                 │
│     checkUsageAllowed(accountId, estimatedTokens)               │
│     → Soft check, blocks obvious over-limit cases               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. INNGEST FUNCTION (7 steps)                                  │
│     Each step persists usage via accumulate_step_usage()        │
│     → Idempotent upsert, survives crashes and retries           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. COMPLETION (Enhanced)                                       │
│     complete_report_with_usage() - sums steps + hard cap check  │
│     → Bills actual tokens, rejects if >110% over limit          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Simplified Implementation Plan

### Phase 1: Database Migration (1 hour)

**File: `apps/web/supabase/migrations/20260108000000_step_usage_tracking.sql`**

```sql
-- =============================================================================
-- Step-level usage tracking (enables partial billing on failure/cancel)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.report_step_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.sparlo_reports(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  tokens BIGINT NOT NULL DEFAULT 0 CHECK (tokens >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Idempotency: one record per step per report
  CONSTRAINT report_step_usage_unique UNIQUE (report_id, step_name)
);

-- Indexes for query patterns
CREATE INDEX IF NOT EXISTS idx_step_usage_report ON report_step_usage(report_id);
CREATE INDEX IF NOT EXISTS idx_step_usage_account ON report_step_usage(account_id);

-- RLS (service role only for writes)
ALTER TABLE report_step_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own step usage" ON report_step_usage
  FOR SELECT USING (
    account_id = auth.uid()
    OR public.has_role_on_account(account_id)
  );

CREATE POLICY "Service role only writes" ON report_step_usage
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Service role only updates" ON report_step_usage
  FOR UPDATE USING (false);

-- Grant permissions
REVOKE ALL ON public.report_step_usage FROM authenticated;
GRANT SELECT ON public.report_step_usage TO authenticated;
GRANT ALL ON public.report_step_usage TO service_role;

-- =============================================================================
-- Idempotent step usage accumulation
-- =============================================================================
CREATE OR REPLACE FUNCTION public.accumulate_step_usage(
  p_report_id UUID,
  p_account_id UUID,
  p_step_name TEXT,
  p_tokens BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO report_step_usage (report_id, account_id, step_name, tokens)
  VALUES (p_report_id, p_account_id, p_step_name, p_tokens)
  ON CONFLICT (report_id, step_name)
  DO UPDATE SET
    tokens = GREATEST(report_step_usage.tokens, EXCLUDED.tokens),  -- Keep higher value
    updated_at = NOW();

  RETURN jsonb_build_object('success', true, 'step', p_step_name, 'tokens', p_tokens);
END;
$$;

-- =============================================================================
-- Enhanced completion with hard cap and step summing
-- =============================================================================
CREATE OR REPLACE FUNCTION public.complete_report_with_usage(
  p_report_id UUID,
  p_account_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_tokens BIGINT;
  v_current_used BIGINT;
  v_limit BIGINT;
  v_already_processed BOOLEAN;
BEGIN
  -- Idempotency check FIRST
  SELECT EXISTS(
    SELECT 1 FROM token_usage_events
    WHERE idempotency_key = p_idempotency_key
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  -- Sum all step usage for this report
  SELECT COALESCE(SUM(tokens), 0) INTO v_total_tokens
  FROM report_step_usage
  WHERE report_id = p_report_id;

  -- Get current usage and limit
  SELECT tokens_used, tokens_limit INTO v_current_used, v_limit
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  FOR UPDATE;  -- Lock for atomic update

  -- Hard cap check: reject if >110% over limit
  IF v_current_used + v_total_tokens > v_limit * 1.1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'usage_limit_exceeded',
      'current_used', v_current_used,
      'total_tokens', v_total_tokens,
      'limit', v_limit
    );
  END IF;

  -- Record in idempotency table
  INSERT INTO token_usage_events (idempotency_key, account_id, tokens, report_id)
  VALUES (p_idempotency_key, p_account_id, v_total_tokens, p_report_id);

  -- Increment usage
  PERFORM increment_usage(p_account_id, v_total_tokens, true, false);

  RETURN jsonb_build_object(
    'success', true,
    'total_tokens', v_total_tokens,
    'new_balance', v_current_used + v_total_tokens
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.accumulate_step_usage TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_report_with_usage TO service_role;
```

### Research Insight: Data Integrity Requirements

**From data-integrity-guardian agent:**

> Missing foreign keys create orphaned records. The corrected schema above includes:
> - `REFERENCES public.sparlo_reports(id) ON DELETE CASCADE`
> - `REFERENCES public.accounts(id) ON DELETE CASCADE`
> - `CHECK (tokens >= 0)` to prevent negative values

### Phase 2: TypeScript Helper (30 min)

**File: `apps/web/lib/inngest/utils/step-usage.ts`**

```typescript
import { getSupabaseServerAdminClient } from '@/lib/supabase/server';

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

interface PersistResult {
  success: boolean;
  error?: string;
}

/**
 * Persist step token usage immediately after LLM call.
 * Idempotent - safe to call multiple times for same step.
 * Non-blocking - logs errors but doesn't throw to avoid breaking report generation.
 */
export async function persistStepUsage(
  reportId: string,
  accountId: string,
  stepName: string,
  usage: TokenUsage
): Promise<PersistResult> {
  try {
    const supabase = getSupabaseServerAdminClient();

    const { error } = await supabase.rpc('accumulate_step_usage', {
      p_report_id: reportId,
      p_account_id: accountId,
      p_step_name: stepName,
      p_tokens: usage.totalTokens,
    });

    if (error) {
      console.error('[persistStepUsage] Failed to persist', {
        reportId,
        stepName,
        error: error.message,
      });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[persistStepUsage] Unexpected error', { reportId, stepName, error: message });
    return { success: false, error: message };
  }
}
```

### Research Insight: TypeScript Review Finding

**From kieran-typescript-reviewer agent:**

> **Critical Issue**: Original helper had no error handling. The corrected version above:
> - Returns a result object instead of throwing
> - Logs errors but doesn't break report generation
> - Usage tracking is secondary to report delivery

### Phase 3: Update Inngest Functions (2 hours)

**File: `apps/web/lib/inngest/functions/generate-report.ts`**

Add after each LLM call:

```typescript
import { persistStepUsage } from '../utils/step-usage';

// Inside the Inngest function, after each step:
const an0Result = await step.run('an0-problem-framing', async () => {
  await updateProgress({ current_step: 'an0', phase_progress: 0 });

  const { content, usage } = await callClaude({
    system: AN0_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildAN0UserPrompt(state) }],
    model: MODELS.OPUS,
  });

  // NEW: Persist usage immediately (non-blocking)
  await persistStepUsage(reportId, accountId, 'an0', usage);

  const parsed = parseJsonResponse<AN0Output>(content, 'AN0');
  const validated = AN0OutputSchema.parse(parsed);
  await updateProgress({ phase_progress: 100 });

  return { result: validated, usage };
});
```

**Update completion step:**

```typescript
await step.run('complete-report', async () => {
  const freshSupabase = getSupabaseServerAdminClient();
  const idempotencyKey = `report-${reportId}-completion`;

  // Use new completion function that sums step usage
  const { data: completion, error: completionError } = await freshSupabase.rpc(
    'complete_report_with_usage',
    {
      p_report_id: reportId,
      p_account_id: accountId,
      p_idempotency_key: idempotencyKey,
    }
  );

  if (completionError) {
    console.error('[Inngest] Failed to complete report:', completionError);
  } else if (!completion.success) {
    console.error('[Inngest] Report completion rejected:', completion);
    // Still save the report, but log the billing issue
  }

  // Update report status (existing code)
  await freshSupabase.from('sparlo_reports').update({
    status: 'complete',
    token_usage: { totalTokens: completion?.total_tokens || 0 },
    updated_at: new Date().toISOString(),
  }).eq('id', reportId);
});
```

**Update onFailure handler:**

```typescript
onFailure: async ({ error, event, step }) => {
  const reportId = event.event.data.reportId;
  const accountId = event.event.data.accountId;

  await step.run('finalize-on-failure', async () => {
    const supabase = getSupabaseServerAdminClient();
    const idempotencyKey = `report-${reportId}-failure`;

    // Bill for completed steps (partial billing)
    const { data: completion } = await supabase.rpc('complete_report_with_usage', {
      p_report_id: reportId,
      p_account_id: accountId,
      p_idempotency_key: idempotencyKey,
    });

    // Update report status to failed
    await supabase.from('sparlo_reports').update({
      status: 'failed',
      error_message: 'Report generation failed. You were only charged for completed steps.',
      token_usage: { totalTokens: completion?.total_tokens || 0 },
      updated_at: new Date().toISOString(),
    }).eq('id', reportId);
  });
},
```

### Research Insight: Inngest Cancellation Pattern

**From `docs/solutions/integration-issues/inngest-report-cancellation.md`:**

You already have cancellation handling via `cancelOn`. The existing pattern catches `inngest/function.cancelled` events. The same `complete_report_with_usage` function works for cancellation:

```typescript
// In a separate function listening for inngest/function.cancelled
// OR use the existing onFailure handler which catches cancellations too
```

---

## Performance Optimizations

### Research Insight: Performance Oracle Recommendations

**From performance-oracle agent:**

| Issue | Impact | Solution |
|-------|--------|----------|
| FOR UPDATE lock contention | High under load | Use advisory locks instead |
| 7 INSERTs per report | Moderate | Batch inserts (optional) |
| Missing index for cleanup | Low | Already added in migration |

**Advisory Lock Pattern (for future scaling):**

```sql
-- Instead of FOR UPDATE on usage_periods:
SELECT pg_advisory_xact_lock(hashtext('usage:' || p_account_id::text));
```

**For soft launch**: The current FOR UPDATE pattern is sufficient at your scale. Revisit if you see lock contention.

### Research Insight: PostgreSQL Locking Best Practices

**From Context7 PostgreSQL documentation:**

> `SELECT FOR UPDATE` locks the returned rows against concurrent updates. It temporarily blocks other transactions from acquiring the same lock.

The migration already uses `FOR UPDATE` correctly in `complete_report_with_usage`. This is appropriate for billing operations where consistency trumps performance.

---

## Edge Cases & Decisions

### Accepted for Soft Launch

| Edge Case | Decision | Rationale |
|-----------|----------|-----------|
| **User starts 3 reports with 1 report's tokens** | First completes, others hit hard cap | 110% overage grace handles edge cases |
| **Report fails mid-way** | Bill for completed steps only | Fair, accurate, uses step_usage table |
| **User cancels mid-report** | Bill for completed steps | Same as failure handling |
| **Inngest retries a step** | Idempotent via UNIQUE constraint | `ON CONFLICT` prevents double-billing |
| **Two concurrent reports race** | Pre-flight check reduces likelihood, hard cap catches rest | Accept ~10% overage for simplicity |

### Deferred to Post-Launch

| Edge Case | Decision | Why Defer | Trigger to Implement |
|-----------|----------|-----------|---------------------|
| **Full reservation system** | Use soft check + hard cap | Complexity vs benefit | >5% overage rate |
| **Auto-refund on system errors** | Handle via CS | Needs error classification | High support volume |
| **Real-time token display** | Show after completion | WebSocket complexity | User feedback |
| **Multi-device prevention** | Not blocking | Rare edge case | Reported abuse |

---

## Testing Checklist

### Unit Tests

- [ ] `accumulate_step_usage` is idempotent (duplicate calls succeed, keep higher value)
- [ ] `complete_report_with_usage` sums all step usage correctly
- [ ] `complete_report_with_usage` rejects when >110% over limit
- [ ] `complete_report_with_usage` returns `already_processed` on duplicate idempotency key
- [ ] Foreign key cascade deletes step_usage when report deleted

### Integration Tests

- [ ] Happy path: Report completes → correct tokens billed
- [ ] Failure: Report fails at step 4 → steps 1-3 billed
- [ ] Cancellation: Report cancelled → completed steps billed
- [ ] Retry: Step retries → tokens counted once only (UNIQUE constraint)
- [ ] Over limit: Report exceeds 110% → completion rejected, steps still recorded

### Manual Smoke Tests

- [ ] Start report with exact tokens needed → succeeds
- [ ] Start report with insufficient tokens → blocked at pre-flight
- [ ] Check usage after completion → correct balance
- [ ] Cancel in-progress report → see partial charge
- [ ] Admin can view `report_step_usage` for debugging

---

## Rollout Plan

### Day 1 (Today/Tomorrow)

1. Create and test migration locally
2. Deploy migration to staging
3. Update `generate-report.ts` with per-step tracking
4. Test happy path + failure path in staging

### Day 2 (Launch Day)

1. Deploy migration to production
2. Deploy updated Inngest functions
3. Monitor first 5-10 reports closely
4. Keep admin panel ready for manual adjustments if needed

### Post-Launch Monitoring

```sql
-- Check for reports without usage (shouldn't happen)
SELECT r.id, r.status, r.created_at
FROM sparlo_reports r
LEFT JOIN report_step_usage rsu ON rsu.report_id = r.id
WHERE r.status IN ('complete', 'failed', 'cancelled')
  AND r.created_at > NOW() - INTERVAL '24 hours'
  AND rsu.id IS NULL;

-- Usage accuracy (compare step sum vs billed)
SELECT
  r.id,
  SUM(rsu.tokens) as step_total,
  (r.token_usage->>'totalTokens')::int as report_total
FROM sparlo_reports r
LEFT JOIN report_step_usage rsu ON rsu.report_id = r.id
WHERE r.created_at > NOW() - INTERVAL '24 hours'
GROUP BY r.id, r.token_usage;

-- Overage incidents (users who exceeded limits)
SELECT account_id, COUNT(*) as overage_count
FROM token_usage_events tue
JOIN usage_periods up ON up.account_id = tue.account_id
WHERE tue.created_at > NOW() - INTERVAL '7 days'
  AND up.tokens_used > up.tokens_limit
GROUP BY account_id;
```

---

## Summary

**What you're getting (Simplified Approach):**

1. **Per-step tracking**: Each Inngest step persists usage immediately → survives crashes, enables partial billing
2. **Hard cap protection**: 110% limit check prevents runaway overages
3. **Idempotency**: UNIQUE constraint + idempotency_key prevents double-billing on retries
4. **Proper error handling**: onFailure handler bills for completed work

**What you're deferring:**

1. Full reservation system (implement when overage >5%)
2. Auto-refunds (use CS + admin panel)
3. Real-time usage display (show after completion)
4. Concurrent report prevention (soft check + hard cap is sufficient)

**Estimated effort**: 3-4 hours total

**Risk level**: Low - changes are additive, don't break existing functionality, can be rolled back

---

## References

### Internal Files
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql` - Current usage tracking
- `apps/web/supabase/migrations/20251219232541_fix-usage-tracking-security.sql` - Existing reserve/finalize/release
- `apps/web/supabase/migrations/20260103000004_dd_mode_complete_report_atomic.sql` - DD mode idempotency pattern
- `apps/web/lib/inngest/functions/generate-report.ts:669-687` - Current completion logic
- `apps/web/lib/usage/constants.ts` - Token limits and thresholds
- `docs/solutions/security/usage-tracking-security-hardening.md` - TOCTOU protection patterns
- `docs/solutions/integration-issues/inngest-report-cancellation.md` - Cancellation handling

### External Documentation
- [Inngest Multi-Step Functions](https://www.inngest.com/docs/guides/multi-step-functions)
- [Inngest Error Handling](https://www.inngest.com/docs/guides/error-handling)
- [Inngest Cancellation](https://www.inngest.com/docs/features/inngest-functions/cancellation)
- [PostgreSQL FOR UPDATE](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE)
- [Inngest Step Memoization](https://github.com/inngest/inngest/blob/main/docs/SDK_SPEC.md)
