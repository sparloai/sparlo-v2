---
status: completed
priority: p1
issue_id: "073"
tags: [code-review, data-integrity, database, usage-tracking, compliance]
dependencies: []
---

# CASCADE DELETE Destroys Billing Data - Compliance Risk

## Problem Statement

The `usage_periods` table has `ON DELETE CASCADE` on the `account_id` foreign key. If an account is deleted, ALL usage history is instantly destroyed with no audit trail.

**Why it matters:**
- Cannot prove usage for billing disputes/chargebacks
- Violates financial record retention requirements (many jurisdictions require 7 years)
- No forensics for fraud detection
- Potential regulatory compliance violations

## Findings

### Evidence from Data Integrity Review

**File:** `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql` (Line 5)

```sql
account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
```

**Compliance Violation Scenario:**
```
Day 1: User generates $500 in API usage
Day 2: User deletes account (frustrated with billing)
Day 3: All usage_periods CASCADE DELETED
Day 4: User disputes charge with credit card
Day 5: You have NO RECORDS to prove the usage occurred
Result: Chargeback + compliance violation
```

## Proposed Solutions

### Solution 1: Change to ON DELETE RESTRICT (Recommended)
**Pros:** Prevents deletion of accounts with usage history, simple
**Cons:** Users cannot delete accounts until usage is archived
**Effort:** Small (30 mins)
**Risk:** Low - requires handling account deletion differently

```sql
ALTER TABLE usage_periods
DROP CONSTRAINT usage_periods_account_id_fkey,
ADD CONSTRAINT usage_periods_account_id_fkey
  FOREIGN KEY (account_id)
  REFERENCES accounts(id)
  ON DELETE RESTRICT;
```

### Solution 2: Soft Delete with Archival
**Pros:** Preserves data while allowing account "deletion"
**Cons:** More complex, requires archival process
**Effort:** Medium (2-3 hours)
**Risk:** Low

```sql
ALTER TABLE usage_periods ADD COLUMN deleted_at TIMESTAMPTZ;
-- Then archive records before allowing account deletion
```

### Solution 3: ON DELETE SET NULL with Orphan Tracking
**Pros:** Keeps records but marks them as orphaned
**Cons:** Loses account association, complicates queries
**Effort:** Medium (1-2 hours)
**Risk:** Medium - data association is lost

## Recommended Action

Solution 1 - Change to ON DELETE RESTRICT. This is the safest approach for billing data. Account deletion should be a separate process that archives usage data first.

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`
- Account deletion logic (needs to handle archived usage)

**Database changes required:**
- Modify foreign key constraint
- Potentially add archival process

## Acceptance Criteria

- [ ] Account deletion is blocked if usage history exists
- [ ] Usage data is preserved for billing/compliance
- [ ] Proper archival process exists before account can be deleted
- [ ] At least 7 years of usage history is retained

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From data integrity review |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Data Integrity Review Agent: Identified as CRITICAL severity
- Financial record retention requirements vary by jurisdiction
