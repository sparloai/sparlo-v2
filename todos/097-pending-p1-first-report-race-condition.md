---
status: pending
priority: p1
issue_id: "097"
tags:
  - code-review
  - data-integrity
  - race-condition
  - security
dependencies: []
---

# Race Condition in First Report Generation

## Problem Statement

The usage check and first report marking happen separately, allowing users to potentially generate 2 free reports instead of 1 by making concurrent requests.

## Findings

- **File:** `apps/web/app/home/(user)/_lib/server/usage.service.ts`
- **Lines:** 47-171
- **Agent:** Data Integrity Guardian

**Attack Scenario:**
```
Request 1: checkUsageAllowed() -> first_report_used_at = null -> allowed=true
Request 2: checkUsageAllowed() -> first_report_used_at = null -> allowed=true
Both requests proceed to generate report
Only ONE markFirstReportUsed() succeeds, but BOTH reports may generate
```

React `cache()` only prevents multiple calls **within the same request**, not concurrent requests from different tabs.

## Proposed Solutions

### Option A: Atomic Check-and-Mark (Recommended)
**Pros:** Guaranteed correctness, single DB operation
**Cons:** Requires SQL function modification
**Effort:** 2 hours
**Risk:** Medium

Modify `mark_first_report_used` to return whether it was the first marking:
```sql
CREATE OR REPLACE FUNCTION public.mark_first_report_used(p_account_id UUID)
RETURNS TABLE(was_marked BOOLEAN, previous_value TIMESTAMPTZ)
```

Then check BEFORE generating the report.

### Option B: Row Locking with SELECT FOR UPDATE
**Pros:** Standard DB pattern
**Cons:** Longer lock time
**Effort:** 3 hours
**Risk:** Medium

## Technical Details

### Affected Files
- `apps/web/app/home/(user)/_lib/server/usage.service.ts`
- `apps/web/supabase/migrations/` (new migration)

## Acceptance Criteria

- [ ] Concurrent requests cannot both generate free reports
- [ ] Second concurrent request receives appropriate error
- [ ] No false positives (legitimate sequential requests work)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from data integrity review | - |

## Resources

- PR: Current uncommitted changes
- Related: Data Integrity Guardian findings
