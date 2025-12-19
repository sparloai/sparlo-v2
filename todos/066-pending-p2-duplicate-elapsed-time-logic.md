---
status: completed
priority: p2
issue_id: "066"
tags: [code-review, duplication, refactor]
dependencies: []
---

# Duplicate Elapsed Time Logic Across Components

## Problem Statement

The elapsed time calculation logic (`calculateElapsed`, `formatElapsed`, `useElapsedTime`) is duplicated across two components:
- `processing-screen.tsx` (lines 82-128)
- `reports-dashboard.tsx` (lines 38-79)

This violates DRY principle and creates maintenance burden.

## Findings

### Location 1: processing-screen.tsx (lines 82-128)
```typescript
function calculateElapsed(createdAt: string | null): number { ... }
function useElapsedTime(createdAt: string | null): number { ... }
function formatElapsed(seconds: number): string { ... }
```

### Location 2: reports-dashboard.tsx (lines 38-79)
```typescript
function calculateElapsed(createdAt: string): number { ... }
function formatElapsed(seconds: number): string { ... }
function ElapsedTime({ createdAt }: { createdAt: string }) { ... }
```

The logic is nearly identical with minor differences in null handling.

## Proposed Solutions

### Option A: Extract to Shared Utility (Recommended)
Create `/apps/web/app/home/(user)/_lib/utils/elapsed-time.ts` with all elapsed time utilities.

**Pros**: Single source of truth, easy to test, clear ownership
**Cons**: Additional file to maintain
**Effort**: Small (30 min)
**Risk**: Low

### Option B: Create Custom Hook Package
Move to `@kit/hooks/use-elapsed-time`.

**Pros**: Reusable across apps
**Cons**: Overkill for current use case
**Effort**: Medium (1 hour)
**Risk**: Low

## Recommended Action

Option A - Extract to shared utility in the `_lib/utils` directory.

## Technical Details

**Affected files**:
- `apps/web/app/home/(user)/_components/processing-screen.tsx`
- `apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- New: `apps/web/app/home/(user)/_lib/utils/elapsed-time.ts`

## Acceptance Criteria

- [ ] Single utility file exports `calculateElapsed`, `formatElapsed`, `useElapsedTime`
- [ ] Both components import from shared utility
- [ ] No duplicate implementations remain
- [ ] All existing functionality preserved

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2024-12-19 | Created | From code review |

## Resources

- PR: Current branch changes
- Files: processing-screen.tsx, reports-dashboard.tsx
