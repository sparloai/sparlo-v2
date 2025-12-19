---
status: pending
priority: p2
issue_id: "062"
tags: [code-review, react, duplication, discovery-mode]
dependencies: []
---

# 95% Code Duplication Between Report Pages

## Problem Statement

The discovery new report page (`/reports/discovery/new/page.tsx`) duplicates ~95% of the standard new report page. The only differences are color scheme (emerald vs violet), labels, and one extra info banner. This creates ~350 lines of duplicated JSX.

## Findings

**From pattern-recognition-specialist:**

**Duplicated Code:**
1. `FormState` interface (lines 27-35) - 100% identical
2. `CONTEXT_DETECTIONS` array (lines 42-71) - 100% identical
3. `detectedContexts` useMemo (lines 121-132) - 100% identical
4. `handleSubmit`, `handleKeyDown`, `handleViewReport` callbacks - 90% identical
5. Entire JSX structure (lines 195-437) - ~350 lines with only color/text differences

**Key Differences:**
- Color: `violet-*` vs `emerald-*`
- Icon: `Terminal` vs `Compass/Sparkles`
- Labels: "Analysis" vs "Discovery Analysis"
- Button: "Run Analysis" vs "Run Discovery"
- Extra: Discovery info banner (10 lines)

**Evidence:**
- `reports/new/page.tsx`: 416 lines
- `reports/discovery/new/page.tsx`: 440 lines
- Unique to discovery: ~24 lines (6%)

## Proposed Solutions

### Option A: Extract Shared ReportCreationForm Component (Recommended)

```typescript
// apps/web/app/home/(user)/reports/_components/report-creation-form.tsx
interface ReportCreationFormProps {
  mode: 'standard' | 'discovery';
  onSubmit: (challenge: string) => Promise<{ reportId: string }>;
  themeColor: 'violet' | 'emerald';
  estimatedTime: string;
  placeholder: string;
  infoBanner?: React.ReactNode;
}

export function ReportCreationForm({ mode, onSubmit, ... }: ReportCreationFormProps) {
  // All shared logic here
}
```

**Pros:** Eliminates ~350 lines of duplication, single source of truth
**Cons:** Requires config-driven approach for styling
**Effort:** Medium (4-6 hours)
**Risk:** Low

### Option B: Use CSS Variables for Theming
Keep components separate but use CSS variables for colors.

**Pros:** Less invasive, keeps components independent
**Cons:** Still duplicates structure and logic
**Effort:** Low (2-3 hours)
**Risk:** Low

### Option C: Higher-Order Component
Create HOC that wraps shared logic and injects mode-specific props.

**Pros:** Flexible pattern
**Cons:** HOCs are less idiomatic in modern React
**Effort:** Medium (3-4 hours)
**Risk:** Medium

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/new/page.tsx`
- `apps/web/app/home/(user)/reports/discovery/new/page.tsx`
- New: `apps/web/app/home/(user)/reports/_components/report-creation-form.tsx`
- New: `apps/web/app/home/(user)/reports/_lib/context-detector.ts`

**Components:** ReportCreationForm, ContextDetector

**Database Changes:** None

## Acceptance Criteria

- [ ] Shared component renders both modes correctly
- [ ] Context detection logic in single location
- [ ] Form state management in single location
- [ ] Color theming configurable per mode
- [ ] Both pages reduced to <50 lines
- [ ] No visual changes to either mode

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | Identified during code review |

## Resources

- PR: Discovery Mode commit f8b0587
- File: `reports/discovery/new/page.tsx`
