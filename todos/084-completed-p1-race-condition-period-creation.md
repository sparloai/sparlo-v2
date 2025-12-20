---
status: pending
priority: p1
issue_id: "084"
tags: [database, concurrency, usage-tracking]
dependencies: []
---

# Race Condition in Usage Period Creation

Concurrent requests can cause duplicate period creation or failures due to missing advisory locks in `get_or_create_usage_period()`.

## Problem Statement

The `get_or_create_usage_period()` function uses INSERT ON CONFLICT for upsert, but concurrent requests can still race. The code comments mention advisory locks should be used but they're not implemented. This causes:

1. Potential duplicate period records
2. Constraint violation errors under load
3. Unreliable usage tracking during high concurrency
4. Poor user experience with intermittent errors

## Findings

- Function uses `INSERT ... ON CONFLICT DO NOTHING` pattern
- No advisory locks to serialize period creation
- Race window exists between SELECT check and INSERT
- Production traffic with concurrent report requests will trigger this

**Affected code:**
```sql
-- Current implementation (vulnerable)
INSERT INTO usage_periods (account_id, period_start, ...)
VALUES (p_account_id, v_period_start, ...)
ON CONFLICT (account_id, period_start) DO NOTHING;
```

## Proposed Solutions

### Option 1: Add Advisory Lock

**Approach:** Use `pg_advisory_xact_lock()` to serialize period creation per account.

**Pros:**
- Prevents race completely
- Standard PostgreSQL pattern
- Minimal performance impact

**Cons:**
- Adds slight latency for concurrent requests

**Effort:** 1 hour

**Risk:** Low

**Implementation:**
```sql
-- Acquire advisory lock based on account_id hash
PERFORM pg_advisory_xact_lock(hashtext('usage_period_' || p_account_id::text));

-- Now safe to do SELECT + INSERT
```

---

### Option 2: Use FOR UPDATE SKIP LOCKED Pattern

**Approach:** Lock existing row if present, skip if locked.

**Pros:**
- No explicit advisory locks
- PostgreSQL handles contention

**Cons:**
- More complex logic
- May not prevent all races

**Effort:** 1-2 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`

**Migration required:** Yes - need to update function

## Acceptance Criteria

- [ ] Advisory lock added to `get_or_create_usage_period()`
- [ ] Concurrent requests don't cause errors
- [ ] No duplicate period records created
- [ ] Typecheck passes
- [ ] Concurrency test with parallel requests passes

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Data Integrity Guardian)

**Actions:**
- Analyzed `get_or_create_usage_period()` function
- Identified race window in SELECT/INSERT pattern
- Confirmed advisory locks not implemented
- Proposed lock-based solution

**Learnings:**
- INSERT ON CONFLICT alone doesn't prevent all races
- Advisory locks are standard pattern for this scenario
- Account-specific lock hash prevents global contention

## Notes

- HIGH priority - will cause issues in production under load
- Consider load testing after fix is applied
- May need similar fix in other functions
