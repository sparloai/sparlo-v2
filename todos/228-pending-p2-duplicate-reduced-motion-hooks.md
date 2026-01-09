---
status: pending
priority: p2
issue_id: "228"
tags:
  - code-review
  - animation
  - duplication
  - hooks
dependencies:
  - "225"
---

# Duplicate Reduced Motion Hooks (3 Implementations)

## Problem Statement

Three separate implementations of `usePrefersReducedMotion` exist in the codebase, using different patterns (useState vs useSyncExternalStore). This causes confusion and potential inconsistencies in how reduced motion is handled.

**Why it matters**: Different implementations may have different behavior (hydration handling, reactivity). Developers may accidentally import the wrong one, leading to bugs.

## Findings

### Evidence

**Implementation 1**: `/apps/web/lib/hooks/use-prefers-reduced-motion.ts` (50 lines)
- Uses `useState` with initializer
- Has hydration mismatch issue (see todo #225)
- Newly created

**Implementation 2**: `/apps/web/app/app/_hooks/use-prefers-reduced-motion.ts` (33 lines)
- Uses `useSyncExternalStore`
- Better hydration handling
- Older implementation

**Implementation 3**: `/packages/ui/src/hooks/use-prefers-reduced-motion.ts` (33 lines)
- Uses `useSyncExternalStore`
- Identical to Implementation 2
- Part of shared UI package

### Usage Pattern

Different components import from different locations:
```typescript
// Some components use local hook
import { usePrefersReducedMotion } from '~/lib/hooks/use-prefers-reduced-motion';

// Others use app-specific hook
import { usePrefersReducedMotion } from '../_hooks/use-prefers-reduced-motion';

// Others use package hook
import { usePrefersReducedMotion } from '@kit/ui/hooks';
```

### Agent Reports

- **Pattern Recognition**: "CRITICAL: Duplicate reduced motion hooks - Three implementations exist"
- **Code Simplicity Reviewer**: "THREE duplicate usePrefersReducedMotion hooks - should consolidate"
- **Architecture Strategist**: "The useSyncExternalStore implementation is technically superior (proper React 18+ concurrent mode support)"

## Proposed Solutions

### Solution 1: Standardize on Package Hook (Recommended)
**Description**: Use `@kit/ui/hooks` as the single source of truth, delete duplicates.

**Pros**:
- Shared across all packages
- Uses React 18+ best practices (useSyncExternalStore)
- Single source of truth

**Cons**:
- Need to update all imports
- Package dependency required

**Effort**: Medium (1 hour)
**Risk**: Low

**Steps**:
1. Delete `/apps/web/lib/hooks/use-prefers-reduced-motion.ts`
2. Delete `/apps/web/app/app/_hooks/use-prefers-reduced-motion.ts`
3. Update all imports to use `@kit/ui/hooks`
4. Verify build and tests pass

### Solution 2: Keep App-Level Hook Only
**Description**: Consolidate to the app-specific hook, remove from package.

**Pros**:
- Simpler dependency chain
- Can customize for app needs

**Cons**:
- Not reusable across packages
- Still need to update imports

**Effort**: Medium (1 hour)
**Risk**: Low

### Solution 3: Document and Deprecate
**Description**: Mark the less-preferred implementations as deprecated.

**Pros**:
- Non-breaking
- Gradual migration

**Cons**:
- Duplication persists
- May be forgotten

**Effort**: Small (15 minutes)
**Risk**: Medium

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

### Affected Files
**DELETE**:
- `apps/web/lib/hooks/use-prefers-reduced-motion.ts`
- `apps/web/app/app/_hooks/use-prefers-reduced-motion.ts`

**KEEP**:
- `packages/ui/src/hooks/use-prefers-reduced-motion.ts`

**UPDATE IMPORTS**:
- `apps/web/lib/hooks/use-adaptive-spring.ts`
- `apps/web/app/app/_components/animated-reports-list.tsx`
- `apps/web/app/app/_components/page-transition.tsx`

### Testing Required
- Verify reduced motion preference is respected
- Test preference change detection
- Verify no hydration warnings

## Acceptance Criteria

- [ ] Single `usePrefersReducedMotion` implementation exists
- [ ] All components import from same location
- [ ] Reduced motion preference works correctly
- [ ] No hydration warnings

## Work Log

| Date | Action | Outcome | Learnings |
|------|--------|---------|-----------|
| 2026-01-09 | Code review identified | Found 3 implementations | Use shared packages for common hooks |

## Resources

- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
