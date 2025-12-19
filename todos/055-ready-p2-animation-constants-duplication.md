---
status: ready
priority: p2
issue_id: "055"
tags: [animation, duplication, framer-motion, architecture]
dependencies: ["050"]
---

# Animation Easing Constants Duplicated Across Files

## Problem Statement

Animation easing curves are defined separately in 3 files with slightly different values. This violates DRY principle and makes it difficult to maintain consistent animation feel across the application.

**Consistency Impact:** Different animations may feel inconsistent; global timing changes require editing multiple files.

## Findings

**Duplicate definitions:**

```typescript
// animated-reports-list.tsx (Line 33)
const easeOut: [number, number, number, number] = [0, 0, 0.2, 1];

// processing-screen.tsx (Lines 32-34)
const easeInOut: [number, number, number, number] = [0.4, 0, 0.6, 1];
const easeOut: [number, number, number, number] = [0, 0, 0.2, 1];
const easeIn: [number, number, number, number] = [0.4, 0, 1, 1];

// page-transition.tsx (Line 11)
const customEasing = [0.25, 0.1, 0.25, 1] as const;
```

**Problems:**
1. `easeOut` defined identically in 2 files
2. No centralized animation configuration
3. Inconsistent naming (`customEasing` vs `easeOut`)
4. Hardcoded duration values throughout

**Reviewers identifying this:**
- Architecture Review: P2 - Animation Variants Defined Outside Component Scope (inconsistency)
- Pattern Recognition: P2 - Animation Easing Duplication

## Proposed Solutions

### Option 1: Create Animation Constants File

**Approach:** Centralize all animation constants.

```typescript
// _lib/animation-constants.ts
export const EASING = {
  easeIn: [0.4, 0, 1, 1],
  easeOut: [0, 0, 0.2, 1],
  easeInOut: [0.4, 0, 0.6, 1],
  custom: [0.25, 0.1, 0.25, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const DURATION = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
} as const;

export const STAGGER = {
  fast: 0.05,
  normal: 0.08,
  slow: 0.12,
} as const;
```

**Usage:**
```typescript
import { EASING, DURATION } from '../_lib/animation-constants';

transition: { duration: DURATION.normal, ease: EASING.easeOut }
```

**Pros:**
- Single source of truth
- Easy global adjustments
- Self-documenting

**Cons:**
- New file to create
- Import overhead

**Effort:** 1.5 hours

**Risk:** Very Low

---

### Option 2: Create Animation Variants Library

**Approach:** Pre-built reusable variants.

```typescript
// _lib/motion-variants.ts
import { Variants } from 'framer-motion';
import { EASING, DURATION } from './animation-constants';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.normal } },
};

export const slideUp = (distance = 16): Variants => ({
  hidden: { opacity: 0, y: distance },
  show: { opacity: 1, y: 0, transition: { ease: EASING.easeOut } },
});
```

**Pros:**
- Reusable patterns
- Parameterized flexibility
- Reduces boilerplate

**Cons:**
- More abstraction
- Larger scope

**Effort:** 3 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (constants file) as immediate fix, Option 2 as follow-up:

1. Create `apps/web/app/home/(user)/_lib/animation-constants.ts`
2. Define EASING, DURATION, and STAGGER constants
3. Update all 3 animation files to import constants
4. Remove local constant definitions

## Technical Details

**New file:**
- `apps/web/app/home/(user)/_lib/animation-constants.ts`

**Files to update:**
- `apps/web/app/home/(user)/_components/animated-reports-list.tsx`
- `apps/web/app/home/(user)/_components/page-transition.tsx`
- `apps/web/app/home/(user)/_components/processing-screen.tsx`

**Constants to centralize:**
- `easeIn`, `easeOut`, `easeInOut`, `customEasing` curves
- Duration values (0.3, 0.4, 2, etc.)
- Stagger delays (0.08, etc.)

## Acceptance Criteria

- [ ] Animation constants file created
- [ ] All easing arrays use imported constants
- [ ] All duration values use imported constants
- [ ] No local easing/duration definitions remain
- [ ] Animations unchanged visually
- [ ] TypeScript compiles without errors

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Architecture and Pattern Recognition reviewers
- Traced duplications across 3 files
- Documented centralization approach

**Learnings:**
- Animation constants should be centralized like design tokens
- Parameterized variants enable flexibility
- Consistent timing creates polished feel
