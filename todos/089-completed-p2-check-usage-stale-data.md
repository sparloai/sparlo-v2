---
status: pending
priority: p2
issue_id: "089"
tags: [usage-tracking, reliability, concurrency]
dependencies: []
---

# check_usage_allowed() Returns Stale Data Under Concurrency

The usage check function can return stale data when multiple requests are processed simultaneously.

## Problem Statement

`check_usage_allowed()` reads usage without locking, then returns allowance status. Between the read and when the caller acts on the result:

1. Another request may have incremented usage
2. Caller proceeds thinking they have budget
3. Both requests succeed, potentially exceeding limits
4. Race window allows over-quota usage

## Findings

- Function performs SELECT without FOR UPDATE
- No transaction coordination with increment
- Time-of-check to time-of-use (TOCTOU) vulnerability
- Under concurrent load, limits can be exceeded

**Vulnerable pattern:**
```
Request A: check_usage_allowed() → 900/1000 tokens used → allowed
Request B: check_usage_allowed() → 900/1000 tokens used → allowed
Request A: increment_usage(200) → 1100/1000 → succeeds
Request B: increment_usage(200) → 1300/1000 → succeeds
```

## Proposed Solutions

### Option 1: Atomic Check-and-Reserve

**Approach:** Combine check and preliminary reservation in one atomic operation.

**Pros:**
- Eliminates race window
- Accurate quota enforcement

**Cons:**
- Need to handle reservation cleanup on failure
- More complex transaction management

**Effort:** 3-4 hours

**Risk:** Medium

---

### Option 2: Optimistic Concurrency with Rollback

**Approach:** Allow slight over-quota, check after increment and compensate if needed.

**Pros:**
- Simpler implementation
- Works well for soft limits

**Cons:**
- Allows temporary over-quota
- Not suitable for hard billing limits

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 3: Pessimistic Locking

**Approach:** Use SELECT FOR UPDATE in check function.

**Pros:**
- Prevents concurrent reads
- Standard database pattern

**Cons:**
- Serializes all usage checks for an account
- May cause contention under load

**Effort:** 1 hour

**Risk:** Medium (performance)

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`

## Acceptance Criteria

- [ ] Concurrent requests cannot exceed limits
- [ ] Performance acceptable under normal load
- [ ] Edge cases tested (exact limit, concurrent bursts)
- [ ] Typecheck passes

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Data Integrity Guardian)

**Actions:**
- Analyzed check_usage_allowed() implementation
- Identified TOCTOU race condition
- Modeled concurrent request scenarios
- Proposed atomic check-and-reserve solution

**Learnings:**
- Read-then-write patterns have race windows
- Billing/quota systems need atomic operations
- Consider reservation pattern for accurate limits

## Notes

- IMPORTANT for accurate billing
- Soft limits may tolerate slight over-quota
- Hard billing limits need atomic enforcement
