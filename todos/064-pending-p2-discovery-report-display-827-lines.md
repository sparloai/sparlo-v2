---
status: pending
priority: p2
issue_id: "064"
tags: [code-review, react, components, discovery-mode]
dependencies: []
---

# Discovery Report Display Component Too Large (827 Lines)

## Problem Statement

The `discovery-report-display.tsx` component is 827 lines with no decomposition. It contains 4 inline helper components, extensive optional chaining, and handles all report sections in a single file. This hurts maintainability, testability, and reusability.

## Findings

**From pattern-recognition-specialist and code-simplicity-reviewer:**

**Component Structure:**
- Lines 1-128: Imports and inline interfaces
- Lines 130-145: `SectionHeader` helper (should be extracted)
- Lines 147-173: `CategoryBadge` helper (should be extracted)
- Lines 175-200: `PriorityBadge` helper (should be extracted)
- Lines 202-219: `NoveltyBadge` helper (should be extracted)
- Lines 221-826: Main component render (600+ lines of JSX)

**Issues:**
1. 4 helper components defined inline but not extracted to files
2. Badge color mappings recreated on every render
3. Extensive optional chaining masks type safety issues
4. No memoization (`React.memo`, `useMemo`)
5. Single file makes testing individual sections difficult

**Loose Type Safety:**
```typescript
interface DiscoveryReportDisplayProps {
  reportData: {
    mode: 'discovery';
    report?: {
      header?: { title?: string; tagline?: string; };
      // ... everything optional
    };
  };
}
```

Should use inferred Zod types for proper type safety.

## Proposed Solutions

### Option A: Extract to Section Components (Recommended)

```
_components/discovery-report/
├── DiscoveryReportDisplay.tsx (orchestrator, ~100 lines)
├── sections/
│   ├── DiscoveryBrief.tsx
│   ├── IndustryBlindSpots.tsx
│   ├── ConceptsList.tsx
│   └── ValidationRoadmap.tsx
└── shared/
    ├── SectionHeader.tsx
    ├── CategoryBadge.tsx
    ├── PriorityBadge.tsx
    └── NoveltyBadge.tsx
```

**Pros:** Testable, reusable, follows best practices
**Cons:** More files to manage
**Effort:** Medium (6-8 hours)
**Risk:** Low

### Option B: Extract Badges Only
Move badge components to shared location but keep sections inline.

**Pros:** Quick win, badges reusable
**Cons:** Main component still too large
**Effort:** Low (2-3 hours)
**Risk:** Low

### Option C: Use Inferred Types
At minimum, replace loose interfaces with Zod-inferred types.

**Pros:** Immediate type safety improvement
**Cons:** Doesn't address component size
**Effort:** Low (1-2 hours)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/[id]/_components/discovery-report-display.tsx`
- New: `_components/discovery-report/sections/*.tsx`
- New: `_components/discovery-report/shared/*.tsx`

**Components:** 8-10 new component files

**Database Changes:** None

## Acceptance Criteria

- [ ] Main component under 150 lines
- [ ] Badge components extracted and memoized
- [ ] Section components individually testable
- [ ] Types inferred from Zod schemas
- [ ] No visual changes to report display
- [ ] Optional chaining reduced where types guarantee data

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | Identified during code review |

## Resources

- PR: Discovery Mode commit f8b0587
- File: `discovery-report-display.tsx`
