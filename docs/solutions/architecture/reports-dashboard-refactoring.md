---
title: "Reports Dashboard Refactoring - Type Consolidation and Shared Components"
category: architecture
tags:
  - code-review
  - type-consolidation
  - shared-components
  - code-duplication
  - cache-revalidation
  - error-handling
  - reports-dashboard
severity: medium
component: Reports Dashboard, Archive Feature
framework: Next.js 16, TypeScript, React 19
date: 2025-12-20
status: completed
---

# Reports Dashboard Refactoring

## Problem

Code review of commit 2e709f0 (mode labels and archive feature) identified multiple code quality issues:

1. **Type duplication**: `ReportData` interface conflicted with existing types
2. **Code duplication**: `formatDate`, `truncate`, `ModeLabel` duplicated across components
3. **Missing cache revalidation**: Archive action didn't revalidate `/home/archived` path
4. **Missing API support**: No `archived` query parameter for agent access
5. **Missing error handling**: Client-side archive button had no try-catch
6. **Separate components**: Archive and Restore buttons were duplicated code

## Root Cause

The issues stemmed from:
- Rapid feature development without refactoring into shared utilities
- Type naming collision between dashboard list data and full report data
- Incomplete cache invalidation when adding new routes
- Missing consideration of agent-native API access

## Solution

### P1: Type Consolidation

Created `DashboardReportData` to differentiate from existing `ReportData`:

```typescript
// apps/web/app/home/(user)/_lib/types.ts
export interface DashboardReportData {
  solution_concepts?: {
    lead_concepts?: unknown[];
    other_concepts?: unknown[];
    spark_concept?: unknown;
  };
  headline?: string;
  mode?: string;
}

export interface DashboardReport {
  id: string;
  title: string;
  headline: string | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
  concept_count: number;
  mode: ReportMode;
}
```

### P1: Shared Utility Functions

Extracted utilities to `report-utils.ts`:

```typescript
// apps/web/app/home/(user)/_lib/utils/report-utils.ts
export function formatReportDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' }),
  }).toUpperCase();
}

export function truncateText(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

export function computeConceptCount(reportData: DashboardReportData | null): number {
  if (!reportData?.solution_concepts) return 0;
  const { lead_concepts, other_concepts, spark_concept } = reportData.solution_concepts;
  return (lead_concepts?.length ?? 0) + (other_concepts?.length ?? 0) + (spark_concept ? 1 : 0);
}

export function extractReportMode(reportData: DashboardReportData | null): ReportMode {
  return reportData?.mode === 'discovery' ? 'discovery' : 'standard';
}
```

### P1: Cache Revalidation Fix

Updated archive action to revalidate both paths:

```typescript
// apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts
export const archiveReport = enhanceAction(
  async (data, user) => {
    // ... archive logic ...

    // Revalidate both active and archived pages
    revalidatePath('/home');
    revalidatePath('/home/archived');
    return { success: true, report };
  },
  { schema: ArchiveReportSchema, auth: true }
);
```

### P2: API Endpoint Enhancement

Added `archived` query parameter:

```typescript
// apps/web/app/api/reports/route.ts
const archived = url.searchParams.get('archived');

if (archived === 'true') {
  query = query.eq('archived', true);
} else if (archived === 'false') {
  query = query.eq('archived', false);
}
```

### P2: Error Handling

Added try-catch in client component:

```typescript
// apps/web/app/home/(user)/_components/shared/archive-toggle-button.tsx
const handleClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  startTransition(async () => {
    try {
      await archiveReport({ id: reportId, archived: !isArchived });
      onComplete?.();
      router.refresh();
    } catch (error) {
      console.error('[ArchiveToggleButton] Failed to update:', error);
    }
  });
};
```

### P3: Unified Archive Button

Created single component for both archive and restore:

```typescript
// apps/web/app/home/(user)/_components/shared/archive-toggle-button.tsx
export function ArchiveToggleButton({ reportId, isArchived, onComplete }) {
  const Icon = isArchived ? RotateCcw : Archive;
  const title = isArchived ? 'Restore report' : 'Archive report';
  // ... button with onClick handling ...
}
```

## Files Changed

- `apps/web/app/home/(user)/_lib/types.ts` - Added DashboardReportData
- `apps/web/app/home/(user)/_lib/utils/report-utils.ts` - New shared utilities
- `apps/web/app/home/(user)/_lib/server/archived-reports.loader.ts` - Uses centralized types
- `apps/web/app/home/(user)/_lib/server/recent-reports.loader.ts` - Uses centralized types
- `apps/web/app/home/(user)/_components/reports-dashboard.tsx` - Uses shared components
- `apps/web/app/home/(user)/_components/shared/archive-toggle-button.tsx` - Unified component
- `apps/web/app/home/(user)/_components/shared/mode-label.tsx` - Shared component
- `apps/web/app/api/reports/route.ts` - Added archived parameter

## Prevention

### Type Consolidation Guidelines

1. **Check existing types** before creating new interfaces with similar names
2. **Use descriptive prefixes** when types serve different purposes (e.g., `DashboardReportData` vs `ReportData`)
3. **Centralize types** in `_lib/types.ts` for each route group

### Shared Component Guidelines

1. **Extract on second use** - when duplicating, move to `_components/shared/`
2. **Create utilities** for formatting functions used in multiple places
3. **Use consistent naming** - `formatReportDate` not `formatDate` to avoid conflicts

### Cache Revalidation Checklist

When adding server actions that modify data:
- [ ] List all pages that display this data
- [ ] Add `revalidatePath()` for each affected page
- [ ] Consider both active and filtered views (e.g., archived)

### Agent-Native API Checklist

When adding UI features that filter data:
- [ ] Add corresponding API query parameters
- [ ] Document the parameter in API response
- [ ] Verify agents can access the same data as the UI

## Related

- `docs/solutions/architecture/agent-native-api-endpoints.md` - API design principles
- `docs/solutions/features/token-based-usage-tracking.md` - Similar patterns
