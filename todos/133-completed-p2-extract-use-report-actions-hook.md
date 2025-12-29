---
status: completed
priority: p2
issue_id: "133"
tags: [architecture, code-review, share-export, dry]
dependencies: []
---

# Extract useReportActions Hook - Eliminate 96 Lines of Duplication

## Problem Statement

Share/export logic is duplicated between `report-display.tsx` and `brand-system-report.tsx`, creating 96 lines of nearly identical code. Bug fixes must be applied in two places.

**Why it matters**: Maintenance burden, inconsistency risk, testing overhead, bundle size.

## Findings

**Source**: Architecture Strategist + Kieran TypeScript reviews of commit d08d4fa

**Duplicated in**:
- `report-display.tsx` (lines 157-185, 128-154) - 76 lines
- `brand-system-report.tsx` (lines 430-508) - 78 lines

**Key Differences**:
1. BrandSystemReport has "no reportId" fallback (unnecessary)
2. BrandSystemReport falls back to clipboard; ReportDisplay falls back to modal
3. Error logging prefixes differ

## Proposed Solutions

### Option A: Extract useReportActions Hook (Recommended)

Create `/apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-report-actions.ts`:

```typescript
interface UseReportActionsOptions {
  reportId: string;
  reportTitle: string;
  onShareFallback?: () => void; // For modal fallback
}

export function useReportActions({
  reportId,
  reportTitle,
  onShareFallback
}: UseReportActionsOptions) {
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleShare = useCallback(async () => {
    // Unified share logic...
  }, [reportId, reportTitle, onShareFallback]);

  const handleExport = useCallback(async () => {
    // Unified export logic...
  }, [reportId, reportTitle]);

  return { handleShare, handleExport, isGeneratingShare, isExporting };
}
```

**Pros**: Single source of truth, testable, reduces bundle size
**Cons**: Requires updating both components
**Effort**: Medium (2-3 hours)
**Risk**: Low

## Recommended Action

Option A - Extract hook, update both components to use it.

## Technical Details

**New File**:
- `apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-report-actions.ts`

**Files to Update**:
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

## Acceptance Criteria

- [ ] Single `useReportActions` hook handles all share/export logic
- [ ] Both report display components use the hook
- [ ] Share functionality works identically in both contexts
- [ ] Export functionality works identically in both contexts
- [ ] Unit tests cover the hook

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | DRY violation from commit d08d4fa |

## Resources

- Commit: d08d4fa
- Lines: report-display.tsx:128-185, brand-system-report.tsx:430-508
