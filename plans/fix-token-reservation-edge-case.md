# fix: Prevent concurrent analyses from bypassing token limits

## Problem

Users can start multiple analyses before their token balance is depleted because:
1. `check_usage_allowed()` only checks `tokens_used` (already consumed)
2. Inngest deducts tokens incrementally over 25 minutes via `increment_usage()`
3. During that 25-minute window, users can start unlimited concurrent analyses

**Affected users:** Free trial users (400k tokens) and subscribers near their limit.

## Solution (Simplified)

**Key insight:** Track reserved tokens per-report, not as a separate aggregate. This:
- Eliminates idempotency issues (each report tracks its own reservation)
- Eliminates need for explicit release calls (status change handles it)
- Eliminates need for cleanup cron job (in-progress reports are naturally bounded)

```sql
-- Available = limit - used - SUM(reserved from in-progress reports)
available = tokens_limit - tokens_used - (
  SELECT COALESCE(SUM(tokens_reserved), 0)
  FROM sparlo_reports
  WHERE account_id = p_account_id
    AND status IN ('pending', 'processing', 'clarifying')
)
```

## Implementation

### 1. Database Migration

**File:** `apps/web/supabase/migrations/[timestamp]_add_report_tokens_reserved.sql`

```sql
-- Add tokens_reserved column to track per-report reservation
ALTER TABLE public.sparlo_reports
ADD COLUMN IF NOT EXISTS tokens_reserved BIGINT NOT NULL DEFAULT 0;

-- Index for efficient SUM aggregation
CREATE INDEX IF NOT EXISTS idx_sparlo_reports_reserved_sum
ON sparlo_reports(account_id, status)
WHERE status IN ('pending', 'processing', 'clarifying');

COMMENT ON COLUMN sparlo_reports.tokens_reserved IS 'Estimated tokens reserved for this report. Used to prevent concurrent analyses from exceeding limits.';
```

### 2. Update `check_usage_allowed` Function

**File:** `apps/web/supabase/schemas/17-usage-periods.sql` (modify existing)

```sql
CREATE OR REPLACE FUNCTION check_usage_allowed(
  p_account_id UUID,
  p_estimated_tokens BIGINT DEFAULT 180000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_period usage_periods;
  v_reserved BIGINT;
  v_available BIGINT;
  v_percentage NUMERIC;
BEGIN
  SELECT * INTO v_period
  FROM usage_periods
  WHERE account_id = p_account_id AND status = 'active'
  LIMIT 1;

  IF v_period IS NULL THEN
    -- No period yet, allow (will be created on first use)
    RETURN jsonb_build_object(
      'allowed', true,
      'tokens_used', 0,
      'tokens_limit', 3000000,
      'remaining', 3000000,
      'tokens_reserved', 0,
      'percentage', 0.0,
      'reports_count', 0,
      'chat_tokens_used', 0,
      'period_end', DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    );
  END IF;

  -- Calculate reserved tokens from in-progress reports
  SELECT COALESCE(SUM(tokens_reserved), 0) INTO v_reserved
  FROM sparlo_reports
  WHERE account_id = p_account_id
    AND status IN ('pending', 'processing', 'clarifying');

  -- Available = limit - used - reserved
  v_available := v_period.tokens_limit - v_period.tokens_used - v_reserved;
  v_percentage := ROUND((v_period.tokens_used::numeric / v_period.tokens_limit) * 100, 1);

  RETURN jsonb_build_object(
    'allowed', v_available >= p_estimated_tokens,
    'tokens_used', v_period.tokens_used,
    'tokens_limit', v_period.tokens_limit,
    'remaining', v_available,
    'tokens_reserved', v_reserved,
    'percentage', v_percentage,
    'reports_count', v_period.reports_count,
    'chat_tokens_used', v_period.chat_tokens_used,
    'period_end', v_period.period_end
  );
END;
$$;
```

### 3. Set `tokens_reserved` When Creating Reports

**File:** `apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts`

In `startReportGeneration()`, when inserting the report (around line 508), add `tokens_reserved`:

```typescript
const { data: newReport, error: insertError } = await client
  .from('sparlo_reports')
  .insert({
    account_id: user.id,
    conversation_id: conversationId,
    title,
    status: 'processing',
    created_by: user.id,
    // NEW: Reserve tokens for this report
    tokens_reserved: USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT, // 350000
  })
  .select()
  .single();
```

**Also update:** `apps/web/app/app/_lib/server/hybrid-reports-server-actions.ts` (same pattern)

### 4. Handle Race Condition (Atomic Check-and-Insert)

The above has a TOCTOU race: check passes, then another request inserts before this one.

**Fix:** Use a database function for atomic check-and-insert:

**File:** `apps/web/supabase/schemas/17-usage-periods.sql` (append)

```sql
-- Atomic check-and-reserve for starting a report
-- Returns NULL if insufficient tokens, otherwise returns the tokens reserved
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

  -- Get or create period if none exists
  IF v_period IS NULL THEN
    v_period := get_or_create_usage_period(p_account_id, 3000000);
  END IF;

  -- Calculate reserved from in-progress reports (this is consistent due to FOR UPDATE)
  SELECT COALESCE(SUM(tokens_reserved), 0) INTO v_reserved
  FROM sparlo_reports
  WHERE account_id = p_account_id
    AND status IN ('pending', 'processing', 'clarifying');

  v_available := v_period.tokens_limit - v_period.tokens_used - v_reserved;

  IF v_available < p_estimated_tokens THEN
    -- Insufficient tokens
    RETURN NULL;
  END IF;

  -- Return the amount to reserve (caller will set tokens_reserved on report insert)
  RETURN p_estimated_tokens;
END;
$$;

GRANT EXECUTE ON FUNCTION try_reserve_tokens_for_report TO authenticated;
```

**Usage in server action:**

```typescript
// Atomic check - this locks to prevent race conditions
const { data: reserveResult } = await client.rpc('try_reserve_tokens_for_report', {
  p_account_id: accountId,
  p_estimated_tokens: USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
});

if (reserveResult === null) {
  // Check if it's because of in-progress reports or depleted tokens
  const usage = await checkUsageAllowed(accountId, USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT);
  if (usage.tokens_reserved > 0) {
    return { error: 'You have analyses in progress. Please wait for them to complete or try again shortly.' };
  }
  return { error: 'Insufficient tokens to run analysis.' };
}

// Now insert the report with tokens_reserved set
const { data: newReport } = await client
  .from('sparlo_reports')
  .insert({
    // ... other fields
    tokens_reserved: reserveResult, // The amount we reserved
  })
  .select()
  .single();
```

### 5. No Explicit Release Needed!

When a report completes (status changes to 'complete' or 'error'):
- It's no longer counted in the `SUM(tokens_reserved) WHERE status IN ('pending', 'processing', 'clarifying')` query
- The reservation is implicitly "released"

**No changes needed to Inngest completion handlers.** The existing flow works:
1. Report starts with `status='processing'` and `tokens_reserved=350000`
2. `check_usage_allowed` sees this report in the SUM → blocks new reports
3. Inngest calls `increment_usage` to charge actual tokens to `tokens_used`
4. Inngest updates report `status='complete'`
5. Report no longer included in SUM → tokens "released"

## Files to Modify

| File | Change |
|------|--------|
| `supabase/migrations/[new].sql` | Add `tokens_reserved` column to `sparlo_reports` |
| `supabase/schemas/17-usage-periods.sql` | Update `check_usage_allowed`, add `try_reserve_tokens_for_report` |
| `app/app/_lib/server/sparlo-reports-server-actions.ts` | Use atomic reservation, set `tokens_reserved` on insert |
| `app/app/_lib/server/hybrid-reports-server-actions.ts` | Same as above |

**Total: 4 files** (down from 11 in original plan)

## What We Removed (Simplifications)

| Removed | Why |
|---------|-----|
| `tokens_reserved` on `usage_periods` | Track per-report instead |
| `reserve_tokens()` function | Integrated into `try_reserve_tokens_for_report` |
| `release_reservation()` function | Status change handles it implicitly |
| Cleanup cron job | No orphaned reservations possible |
| 4 Inngest function modifications | No explicit release needed |
| `step-tokens.ts` modification | No explicit release needed |

## Addressing Reviewer Concerns

### Kieran's Bugs - All Fixed

| Bug | Fix |
|-----|-----|
| Race condition (not atomic) | `try_reserve_tokens_for_report` uses `FOR UPDATE` |
| Period boundary issue | N/A - we track on report, not period |
| Missing accountId in failure handler | N/A - no explicit release needed |
| Double-decrement risk | N/A - no decrement operation |
| N+1 queries in cleanup | N/A - no cleanup job |

### DHH's Concerns - Addressed

| Concern | Response |
|---------|----------|
| Too complex | Reduced from 11 files to 4 |
| Distributed state | Single source of truth: `sparlo_reports.tokens_reserved` + status |
| Cron job is a bandage | Eliminated |
| Use existing data | We DO use `sparlo_reports.status` - that's what makes the "release" implicit |

### Simplicity Review - Adopted

| Suggestion | Adopted? |
|------------|----------|
| Combine into existing functions | ✅ Modified `check_usage_allowed` |
| Remove cleanup cron | ✅ Eliminated |
| Simplify error messages | ✅ Two clear cases |
| Reduce file count | ✅ 4 files instead of 11 |

## Acceptance Criteria

- [ ] Users cannot start a new analysis if `(tokens_limit - tokens_used - reserved_sum) < estimated_cost`
- [ ] Multiple concurrent analyses allowed if tokens are available
- [ ] When analysis completes, reserved tokens are automatically "released" (status change)
- [ ] Race conditions prevented via `FOR UPDATE` lock
- [ ] Error message distinguishes "analyses in progress" from "insufficient tokens"

## Testing

1. **Single analysis with fresh tokens** → should succeed, `tokens_reserved=350000` set
2. **Second analysis while first running** → should fail with "analyses in progress" (if 400k limit)
3. **User with 1M tokens starts 2 concurrent** → both should succeed (1M - 700k = 300k remaining)
4. **User with 1M tokens starts 3 concurrent** → third should fail (1M - 700k < 350k)
5. **First analysis completes** → user can now start another
6. **Rapid double-click** → only one succeeds (FOR UPDATE prevents race)
