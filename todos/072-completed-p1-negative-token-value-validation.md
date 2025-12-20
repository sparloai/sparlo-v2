---
status: completed
priority: p1
issue_id: "072"
tags: [code-review, security, database, usage-tracking]
dependencies: []
---

# Missing Input Validation - Negative Token Values Allowed

## Problem Statement

The `increment_usage()` function accepts `p_tokens BIGINT` without validating it's positive. This allows attackers to **reduce their token usage** by passing negative values, effectively granting themselves unlimited tokens and bypassing all billing limits.

**Why it matters:** Users can bypass paid tier limits, get unlimited report generation for free, causing direct revenue loss and complete business logic bypass.

## Findings

### Evidence from Security Review

**File:** `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql` (Lines 103-154)

**Attack Scenario:**
```typescript
// Attacker reduces their usage by 1 million tokens
await client.rpc('increment_usage', {
  p_account_id: attackerAccountId,
  p_tokens: -1000000,  // Negative value accepted!
  p_is_report: false
});
// Result: tokens_used = -1000000, user has "negative usage" = infinite free quota
```

**Also from Data Integrity Review:**
The database columns have no CHECK constraints:
```sql
tokens_used BIGINT NOT NULL DEFAULT 0,  -- Can go negative!
reports_count INTEGER NOT NULL DEFAULT 0,  -- Can go negative!
```

## Proposed Solutions

### Solution 1: Add Validation in PostgreSQL Function (Recommended)
**Pros:** Enforces at lowest level, cannot be bypassed
**Cons:** None
**Effort:** Small (30 mins)
**Risk:** Low

```sql
-- Add at start of increment_usage():
IF p_tokens <= 0 THEN
  RAISE EXCEPTION 'Invalid token value: must be positive (got %)', p_tokens;
END IF;

-- Also add upper bound to prevent DoS:
IF p_tokens > 500000 THEN  -- Max ~3x normal report size
  RAISE EXCEPTION 'Token value exceeds maximum allowed: %', p_tokens;
END IF;
```

### Solution 2: Add CHECK Constraints on Columns
**Pros:** Defense in depth, prevents negative values at all levels
**Cons:** Additional migration needed
**Effort:** Small (30 mins)
**Risk:** Low

```sql
ALTER TABLE usage_periods
ADD CONSTRAINT usage_periods_tokens_non_negative
  CHECK (tokens_used >= 0),
ADD CONSTRAINT usage_periods_reports_non_negative
  CHECK (reports_count >= 0),
ADD CONSTRAINT usage_periods_chat_tokens_non_negative
  CHECK (chat_tokens_used >= 0);
```

### Solution 3: Both Function Validation AND Column Constraints
**Pros:** Defense in depth, catches bugs at multiple levels
**Cons:** Slightly more code
**Effort:** Small (1 hour)
**Risk:** Low

## Recommended Action

Solution 3 - Implement both function-level validation AND database constraints. This provides defense in depth.

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`
- New migration file for CHECK constraints

**Database changes required:**
- Add input validation to `increment_usage()` function
- Add CHECK constraints on usage_periods columns

## Acceptance Criteria

- [ ] Function rejects negative token values with clear error
- [ ] Function rejects unreasonably large token values (>500K)
- [ ] Database constraints prevent negative values
- [ ] Unit tests verify validation works
- [ ] Cannot reduce usage via negative increment

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From code review - security and data integrity |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Security Review Agent: Identified as CRITICAL-2
- Data Integrity Review Agent: Identified as HIGH severity
