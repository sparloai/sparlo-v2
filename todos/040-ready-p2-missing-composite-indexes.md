---
status: ready
priority: p2
issue_id: "040"
tags: [database, performance, indexes]
dependencies: []
---

# Add Missing Composite Indexes

Queries filter by status+archived but no composite index exists.

## Problem Statement

Common queries filter by both `status` and `archived`:
```sql
SELECT * FROM sparlo_reports
WHERE account_id = $1
  AND status = 'complete'
  AND archived = false
ORDER BY created_at DESC;
```

Individual indexes on `status` and `archived` exist but no composite index. Query planner may not use both efficiently.

## Findings

- File: `apps/web/supabase/migrations/20251216000000_sparlo_reports_v2_enhancements.sql`
- Existing: `idx_sparlo_reports_status`, `idx_sparlo_reports_archived`
- Missing: Composite index on (account_id, status, archived, created_at)

## Proposed Solutions

### Option 1: Add Composite Index (Recommended)

```sql
CREATE INDEX idx_sparlo_reports_account_status_archived
ON sparlo_reports(account_id, status, archived, created_at DESC);
```

**Effort:** 15 minutes (migration)

## Acceptance Criteria

- [ ] Migration with composite index created
- [ ] Query EXPLAIN shows index usage
- [ ] List page queries perform well with many reports
