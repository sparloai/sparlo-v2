---
priority: P2
category: performance
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Optimize Recent Reports Loader Query

## Problem
The loader fetches the entire `report_data` JSONB column to extract a single `mode` field.

```typescript
// recent-reports.loader.ts
.select('id, title, created_at, report_data')  // Fetching entire JSONB
```

## Impact
- Fetching 5 reports with `report_data` containing potentially large solution_concepts arrays
- Typical `report_data` size: 5-50KB per report
- Network overhead: 25-250KB for what should be ~500 bytes
- This query runs on EVERY page load in the sidebar

## Projected Impact at Scale
- At 100 users loading dashboard simultaneously: 2.5-25MB wasted bandwidth
- Database must deserialize JSONB for each row (CPU overhead)

## Solutions (pick one)

### Option 1: Use JSONB path extraction (IMMEDIATE fix)
```typescript
.select('id, title, created_at, report_data->mode')
```

### Option 2: Extract mode to separate column (BEST - requires migration)
```sql
ALTER TABLE sparlo_reports ADD COLUMN mode text DEFAULT 'standard';
CREATE INDEX idx_sparlo_reports_mode ON sparlo_reports(mode);
```
Then update loader: `.select('id, title, created_at, mode')`

### Option 3: Computed column
```sql
ALTER TABLE sparlo_reports
  ADD COLUMN mode_computed text
  GENERATED ALWAYS AS (report_data->>'mode') STORED;
```

## File
`/apps/web/app/home/(user)/_lib/server/recent-reports.loader.ts`

## Effort
- Option 1: 30 minutes
- Option 2: 2 hours (with migration)
- Option 3: 1 hour (with migration)

## Performance Gain
98% reduction in data transfer (250KB to 5KB)
