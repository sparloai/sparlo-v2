---
status: pending
priority: p1
issue_id: "145"
tags: [data-integrity, dd-mode, race-condition, billing, critical]
dependencies: []
---

# DD Mode v2: Race Condition in Token Usage Persistence

## Problem Statement

Token usage increment uses non-atomic RPC call without row-level locking or idempotency protection. Concurrent reports can cause lost token counts (under-billing) or Inngest retries can cause double-counting (over-billing).

## Findings

**Location:** `/apps/web/lib/inngest/functions/generate-dd-report.ts:829-843`

**Vulnerable code:**
```typescript
const { error: usageError } = await supabase.rpc('increment_usage', {
  p_account_id: accountId,
  p_tokens: totalUsage.totalTokens,
  p_is_report: true,
  p_is_chat: false,
});
```

**Race condition scenario (under-count):**
```
T0: Report A completes (100K tokens)
T1: Report B completes (100K tokens)
T2: Report A calls increment_usage, reads current: 500K
T3: Report B calls increment_usage, reads current: 500K (stale)
T4: Report A writes: 600K
T5: Report B writes: 600K (overwrites A's increment)
Result: Only 100K counted instead of 200K
```

**Retry scenario (double-count):**
```
T0: First attempt calls increment_usage(50K) - succeeds
T1: Inngest retry (network blip) calls increment_usage(50K) again
Result: 100K tokens counted for single 50K execution
```

**Impact:**
- Financial Loss: Under-counted usage = under-billing
- Billing Disputes: Inaccurate usage data
- Analytics Corruption: Token metrics unreliable

## Proposed Solutions

### Option A: Row-Level Locking + Idempotency Key (Recommended)
- Add `SELECT FOR UPDATE` in increment function
- Add idempotency key based on Inngest run ID
- Pros: Prevents both race and retry issues
- Cons: Slightly more complex
- Effort: Medium (3-4 hours)
- Risk: Low

### Option B: Atomic Increment Only
- Ensure database function uses `UPDATE SET x = x + val`
- No read-modify-write pattern
- Pros: Simple fix for race condition
- Cons: Doesn't prevent retry double-counting
- Effort: Low (1-2 hours)
- Risk: Low

### Option C: Deferred Batch Processing
- Queue token usage events
- Process in batch with deduplication
- Pros: Most robust, handles all edge cases
- Cons: More complex architecture
- Effort: High (1-2 days)
- Risk: Medium

## Recommended Action

[To be filled during triage]

## Acceptance Criteria

- [ ] Row-level locking prevents concurrent update race
- [ ] Idempotency key prevents retry double-counting
- [ ] Token counts accurate under concurrent load
- [ ] Inngest retries don't duplicate usage
- [ ] Tests verify atomic behavior

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-dd-report.ts`
- Database increment function

**Recommended fix:**
```sql
CREATE OR REPLACE FUNCTION increment_usage(
  p_account_id uuid,
  p_tokens integer,
  p_idempotency_key text
) RETURNS void AS $$
DECLARE
  v_already_processed boolean;
BEGIN
  -- Check idempotency
  SELECT EXISTS(
    SELECT 1 FROM usage_events
    WHERE idempotency_key = p_idempotency_key
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN; -- Already processed, skip
  END IF;

  -- Lock row for update
  PERFORM * FROM usage_periods
  WHERE account_id = p_account_id
  FOR UPDATE;

  -- Atomic increment
  UPDATE usage_periods
  SET tokens_used = tokens_used + p_tokens
  WHERE account_id = p_account_id;

  -- Record for idempotency
  INSERT INTO usage_events (idempotency_key, account_id, tokens)
  VALUES (p_idempotency_key, p_account_id, p_tokens);
END;
$$ LANGUAGE plpgsql;
```

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 data integrity review
- Analyzed race condition and retry scenarios
- Proposed row-locking with idempotency solution

**Learnings:**
- Counter increments need explicit row locking in concurrent systems
- Inngest retries require idempotency keys for billing operations
