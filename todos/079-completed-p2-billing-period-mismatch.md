---
status: completed
priority: p2
issue_id: "079"
tags: [code-review, data-integrity, billing]
dependencies: []
---

# Billing Period Mismatch - Usage Doesn't Align with Subscription

## Problem Statement

Usage periods are hardcoded to calendar months, but subscriptions use variable `period_starts_at` and `period_ends_at` dates. This creates billing misalignment:

- User subscribes Jan 15: Subscription period Jan 15 - Feb 15
- Usage period: Jan 1 - Feb 1 (hardcoded calendar month)
- Result: 14 days of discrepancy in both directions

**Why it matters:** Billing amount doesn't match actual usage period. Users can game the system by subscribing at start/end of month.

## Findings

### Evidence from Data Integrity Review

**File:** `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql` (Lines 84-89)

```sql
-- Create new period (start of current month to start of next month)
v_period_start := DATE_TRUNC('month', NOW());
v_period_end := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
```

**Problem:** Hardcoded to calendar months, ignores subscription dates.

## Proposed Solutions

### Solution 1: Align with Subscription Period (Recommended)
**Pros:** Accurate billing, matches user expectations
**Cons:** More complex logic
**Effort:** Medium (2-3 hours)
**Risk:** Medium - need to handle edge cases

```sql
-- Fetch active subscription period
SELECT period_starts_at, period_ends_at INTO v_subscription
FROM public.subscriptions
WHERE account_id = p_account_id
  AND active = true
ORDER BY period_starts_at DESC
LIMIT 1;

v_period_start := v_subscription.period_starts_at;
v_period_end := v_subscription.period_ends_at;
```

### Solution 2: Keep Calendar Month but Document
**Pros:** Simple, predictable
**Cons:** Billing mismatch persists
**Effort:** Small (30 mins)
**Risk:** Low but issue persists

## Recommended Action

Solution 1 for accuracy, or document the intentional mismatch if calendar months are preferred for simplicity.

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`

## Acceptance Criteria

- [ ] Usage periods align with subscription billing periods
- [ ] OR: Documented that calendar months are intentional

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From data integrity review |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Data Integrity Review Agent: Identified as HIGH severity
