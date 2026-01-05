---
status: pending
priority: p2
issue_id: "151"
tags: [performance, dd-mode, database, indexing]
dependencies: []
---

# DD Mode v2: JSONB Column Lacks Indexing for Version Queries

## Problem Statement

`report_data` is a JSONB column without indexes on version or mode fields. Version migration queries will perform full table scans, causing performance issues and potential timeouts on large datasets.

## Findings

**Location:** `/apps/web/supabase/migrations/20251212000000_triz_reports.sql`

**Current schema (no JSONB indexes):**
```sql
create table public.triz_reports (
  report_data jsonb,
  -- Only top-level column indexes exist
);
```

**Performance impact:**
```sql
-- This query will full scan with 100K reports
SELECT id, report_data
FROM sparlo_reports
WHERE report_data->>'version' = '1.0.0';
-- Takes minutes instead of milliseconds
```

## Proposed Solutions

### Option A: Add Version/Mode Indexes (Recommended)
- Create GIN or expression indexes on JSONB fields
- Pros: Fast lookups, minimal overhead
- Cons: Index maintenance cost
- Effort: Low (1 hour)
- Risk: Low

**Implementation:**
```sql
CREATE INDEX idx_sparlo_reports_version
  ON sparlo_reports ((report_data->>'version'));

CREATE INDEX idx_sparlo_reports_mode
  ON sparlo_reports ((report_data->>'mode'));
```

## Acceptance Criteria

- [ ] Version lookup uses index (EXPLAIN shows Index Scan)
- [ ] Mode lookup uses index
- [ ] Migration queries complete in < 1 second
- [ ] Index creation doesn't lock table (CONCURRENTLY)

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 data integrity review
- Analyzed query patterns
- Proposed expression indexes
