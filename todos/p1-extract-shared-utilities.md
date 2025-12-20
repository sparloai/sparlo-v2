---
priority: P1
category: code-quality
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Extract Shared Report Utilities

## Problem
Multiple utility functions are duplicated across dashboard files:
- `formatDate()` - identical in reports-dashboard.tsx and archived-reports-dashboard.tsx
- `truncate()` - identical in both files
- `computeConceptCount()` - identical in page.tsx and archived/page.tsx
- `ModeLabel` component - identical in 3 files

~150 lines of duplicated code (~25% of new code in commit).

## Impact
- Maintenance burden - changes require updates in multiple files
- Inconsistency risk - one file could diverge
- Violates DRY principle

## Solution
1. Create `/apps/web/app/home/(user)/_lib/utils/report-utils.ts`:
```typescript
export const REPORT_MODE_LABELS = {
  discovery: 'Discovery',
  standard: 'Analysis',
} as const;

export function formatReportDate(dateString: string): string {
  const date = new Date(dateString);
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' }),
  }).toUpperCase();
}

export function truncateText(str: string, length: number): string {
  return str.length <= length ? str : str.slice(0, length).trim() + '...';
}

export function computeConceptCount(reportData: ReportData | null): number {
  if (!reportData?.solution_concepts) return 0;
  const { lead_concepts, other_concepts, spark_concept } = reportData.solution_concepts;
  return (lead_concepts?.length ?? 0) + (other_concepts?.length ?? 0) + (spark_concept ? 1 : 0);
}
```

2. Create shared `ModeLabel` component in `_components/shared/`

3. Update all files to import from shared locations

## Effort
3-4 hours
