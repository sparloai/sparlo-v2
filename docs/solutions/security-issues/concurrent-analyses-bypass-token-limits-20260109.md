---
module: Usage Tracking
date: 2026-01-09
problem_type: security_issue
component: service_object
symptoms:
  - "Users could start multiple analyses during 25-minute processing window"
  - "Token balance not depleted until Inngest completes incrementally"
  - "Free trial users with 400k tokens could run unlimited concurrent analyses"
  - "Subscribers near limit could bypass restrictions"
root_cause: async_timing
resolution_type: code_fix
severity: high
tags: [toctou, race-condition, token-reservation, inngest, usage-limits]
---

# Concurrent Analyses Bypass Token Limits (TOCTOU Race Condition)

## Problem

Users could start multiple analyses before their token balance was depleted because:

1. `check_usage_allowed()` only checked `tokens_used` (already consumed)
2. Inngest deducts tokens incrementally over ~25 minutes via `increment_usage()`
3. During that 25-minute window, users could start unlimited concurrent analyses

**Affected users:**
- Free trial users (400k tokens)
- Subscribers near their monthly limit

### Observable Symptoms

```
Time 0:  User has 400k tokens, 0 used
         check_usage_allowed(400k) → YES (400k >= 350k)

Time 1:  User starts Analysis A
         tokens_used still = 0 (Inngest hasn't deducted yet)

Time 2:  User starts Analysis B
         check_usage_allowed(400k) → YES (400k >= 350k) ← BUG!

Time 3:  User starts Analysis C
         check_usage_allowed(400k) → YES (400k >= 350k) ← BUG!

Time 25min: All 3 complete, using ~1M tokens total
            User only had 400k → OVER LIMIT BY 600K
```

## Root Cause

**Time-of-Check to Time-of-Use (TOCTOU) race condition.**

The usage check (`check_usage_allowed`) and the actual token deduction (`increment_usage`) were separated by ~25 minutes of Inngest processing. During this window, the system had no memory of "in-flight" token consumption.

## Solution

Implemented **per-report token reservation** that:
- Reserves tokens upfront when starting an analysis
- Uses atomic row locking (`FOR UPDATE`) to prevent race conditions
- Auto-releases when report status changes (no explicit release needed)

### Key Formula

```sql
available = tokens_limit - tokens_used - SUM(tokens_reserved WHERE status IN ('pending', 'processing', 'clarifying'))
```

### Implementation

**1. Added `tokens_reserved` column to `sparlo_reports`:**

```sql
ALTER TABLE public.sparlo_reports
ADD COLUMN IF NOT EXISTS tokens_reserved BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_sparlo_reports_reserved_sum
ON sparlo_reports(account_id, status)
WHERE status IN ('pending', 'processing', 'clarifying');
```

**2. Created atomic `try_reserve_tokens_for_report()` function:**

```sql
CREATE OR REPLACE FUNCTION try_reserve_tokens_for_report(
  p_account_id UUID,
  p_estimated_tokens BIGINT DEFAULT 350000
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period usage_periods;
  v_reserved BIGINT;
  v_available BIGINT;
BEGIN
  -- Lock the account's period row to prevent concurrent reservations
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  FOR UPDATE;

  IF v_period IS NULL THEN
    v_period := get_or_create_usage_period(p_account_id, 3000000);
  END IF;

  -- Calculate reserved from in-progress reports
  SELECT COALESCE(SUM(tokens_reserved), 0) INTO v_reserved
  FROM sparlo_reports
  WHERE account_id = p_account_id
    AND status IN ('pending', 'processing', 'clarifying');

  v_available := v_period.tokens_limit - v_period.tokens_used - v_reserved;

  IF v_available < p_estimated_tokens THEN
    RETURN NULL;  -- Insufficient tokens
  END IF;

  RETURN p_estimated_tokens;  -- Caller sets tokens_reserved on insert
END;
$$;
```

**3. Updated server actions to use atomic reservation:**

```typescript
// Before creating report, atomically check and reserve
const { data: reserveResult, error: reserveError } = await (
  client.rpc as CallableFunction
)('try_reserve_tokens_for_report', {
  p_account_id: user.id,
  p_estimated_tokens: USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
});

if (reserveResult === null) {
  const usage = await checkUsageAllowed(user.id, USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT);
  if (usage.tokens_reserved > 0) {
    throw new Error('You have analyses in progress. Please wait for them to complete.');
  }
  throw new Error('Insufficient tokens to run analysis.');
}

// Insert report with reservation
const { data: report } = await client
  .from('sparlo_reports')
  .insert({
    // ... other fields
    tokens_reserved: reserveResult,
  })
  .select()
  .single();
```

### Why This Works

1. **Row-level locking**: `FOR UPDATE` prevents concurrent reservations
2. **Per-report tracking**: Each report tracks its own reservation (idempotent)
3. **Automatic release**: When report status changes to `complete`/`error`, it's excluded from the SUM
4. **No cleanup needed**: Status-based query handles "orphaned" reservations naturally

## Prevention

### Design Pattern: Token Reservation

For any system with:
- Upfront limit checks
- Long-running operations
- Incremental consumption

**Always implement reservation pattern:**

```
┌────────────┐     ┌──────────────┐     ┌────────────┐
│   CHECK    │ ──► │   RESERVE    │ ──► │   EXECUTE  │
│  (atomic)  │     │  (row lock)  │     │   (async)  │
└────────────┘     └──────────────┘     └────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   RELEASE    │ ◄── Status change
                   │  (implicit)  │
                   └──────────────┘
```

### Files Changed

| File | Change |
|------|--------|
| `migrations/add_report_tokens_reserved.sql` | Add column and index |
| `migrations/add_token_reservation_functions.sql` | Add/update SQL functions |
| `schemas/17-usage-periods.sql` | Schema updated |
| `sparlo-reports-server-actions.ts` | Use atomic reservation |
| `hybrid-reports-server-actions.ts` | Use atomic reservation |
| `usage.service.ts` | Add `tokens_reserved` to type |
| `usage/schemas.ts` | Add `tokens_reserved` to schema |

## Related Issues

- PR #14: fix: prevent concurrent analyses from bypassing token limits

## Tags

`toctou`, `race-condition`, `token-reservation`, `inngest`, `usage-limits`, `for-update`, `row-locking`
