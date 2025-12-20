---
priority: P2
category: performance
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Add Database Index on archived Column

## Problem
Both main page and archived page filter by `archived` boolean, but there's no index on this column.

```typescript
// page.tsx
.eq('archived', false)

// archived/page.tsx
.eq('archived', true)
```

## Current Impact
- Full table scan when filtering by archived status
- With 100 reports: Acceptable (~0.1ms overhead)
- With 10,000 reports: Problematic (10-50ms overhead)

## Projected Impact at Scale
- At 10K reports per user: Query time increases from 5ms to 50-100ms
- Sequential scan forces PostgreSQL to read all rows

## Solution
Create partial indexes for optimal performance:

```sql
-- Create migration: add_archived_indexes.sql
CREATE INDEX idx_sparlo_reports_archived_false
  ON sparlo_reports(account_id, created_at DESC)
  WHERE archived = false;

CREATE INDEX idx_sparlo_reports_archived_true
  ON sparlo_reports(account_id, updated_at DESC)
  WHERE archived = true;
```

## Effort
30 minutes (migration)

## Performance Gain
10-20x faster queries at scale
