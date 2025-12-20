---
priority: P1
category: code-quality
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Consolidate ReportMode and Report Type Definitions

## Problem
`ReportMode` type is defined in 5 separate locations creating type drift risk:
- `/apps/web/app/home/(user)/_lib/server/recent-reports.loader.ts`
- `/apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- `/apps/web/app/home/(user)/page.tsx`
- `/apps/web/app/home/(user)/archived/_components/archived-reports-dashboard.tsx`
- `/apps/web/app/home/(user)/archived/page.tsx`

The `Report` interface is also duplicated across these files with slight variations.

## Impact
- If report modes expand (e.g., add 'quick-analysis'), requires changes in 5 files
- TypeScript can't warn about inconsistencies between duplicates
- Violates Single Source of Truth principle

## Solution
1. Add types to existing `_lib/types.ts`:
```typescript
export type ReportMode = 'discovery' | 'standard';

export interface Report {
  id: string;
  title: string;
  headline: string | null;
  status: ConversationStatus;
  current_step?: string | null;
  created_at: string;
  updated_at: string;
  archived?: boolean;
  concept_count: number;
  error_message?: string | null;
  mode: ReportMode;
}
```

2. Update all 5 files to import from centralized location
3. Remove local type definitions

## Effort
2 hours
