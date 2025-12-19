---
status: completed
priority: p2
issue_id: "067"
tags: [code-review, react, race-condition]
dependencies: []
---

# Navigation Effect Race Condition in ProcessingScreen

## Problem Statement

Two separate `useEffect` hooks manage navigation in `processing-screen.tsx`, creating a potential race condition:
1. Effect 1 (lines 162-171): Navigates when `progress.status === 'complete'`
2. Effect 2 (lines 173-187): Navigates when AN0 completes without clarification

Both use the same `hasNavigatedRef` but could theoretically fire in the same render cycle.

## Findings

### Location: processing-screen.tsx (lines 162-187)

```typescript
// Effect 1: Complete status navigation
useEffect(() => {
  if (progress.status === 'complete' && onComplete && !hasNavigatedRef.current) {
    hasNavigatedRef.current = true;
    onComplete();
  }
}, [progress.status, onComplete]);

// Effect 2: AN0 completion navigation
useEffect(() => {
  const movedPastAN0 = ...;
  const noClarificationNeeded = movedPastAN0 && progress.clarifications?.length === 0;

  if (noClarificationNeeded && !hasNavigatedRef.current) {
    hasNavigatedRef.current = true;
    router.push('/home');
  }
}, [progress.status, progress.currentStep, progress.clarifications, router]);
```

**Risk Scenario**: If report completes exactly as AN0 finishes without clarification, both effects might check `hasNavigatedRef.current` before either sets it.

## Proposed Solutions

### Option A: Consolidate to Single Effect (Recommended)
Combine into one effect with priority ordering.

```typescript
useEffect(() => {
  if (hasNavigatedRef.current) return;

  // Priority 1: Report complete
  if (progress.status === 'complete' && onComplete) {
    hasNavigatedRef.current = true;
    onComplete();
    return;
  }

  // Priority 2: AN0 bypass
  if (movedPastAN0 && noClarificationNeeded) {
    hasNavigatedRef.current = true;
    router.push('/home');
  }
}, [progress.status, progress.currentStep, progress.clarifications]);
```

**Pros**: Single source of truth, clear priority, no race condition
**Cons**: Slightly larger effect
**Effort**: Small (15 min)
**Risk**: Low

### Option B: Extract to Custom Hook
Create `useReportNavigation` hook.

**Pros**: Encapsulates navigation logic, testable
**Cons**: More complexity
**Effort**: Medium (45 min)
**Risk**: Low

## Recommended Action

Option A - Consolidate into single effect.

## Technical Details

**Affected files**:
- `apps/web/app/home/(user)/_components/processing-screen.tsx`

## Acceptance Criteria

- [ ] Single navigation effect replaces two separate effects
- [ ] Clear priority ordering (complete > AN0 bypass)
- [ ] `hasNavigatedRef` checked at top of effect
- [ ] All navigation paths tested

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2024-12-19 | Created | From code review |

## Resources

- PR: Current branch changes
- Similar pattern: use-report-progress.ts
