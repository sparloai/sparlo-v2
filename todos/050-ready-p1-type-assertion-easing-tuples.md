---
status: ready
priority: p1
issue_id: "050"
tags: [typescript, animation, framer-motion, type-safety]
dependencies: []
---

# Type Assertion Anti-Pattern in Animation Easing

## Problem Statement

The `page-transition.tsx` component uses dangerous double type assertion (`as unknown as T`) to coerce easing tuple types. This bypasses TypeScript safety and indicates a fundamental type mismatch with Framer Motion.

**Type Safety Impact:** Bypasses TypeScript compiler, could hide runtime errors.

## Findings

- **File:** `apps/web/app/home/(user)/_components/page-transition.tsx` (lines 11, 29)
- **Pattern:** `as const` creates readonly tuple, then `as unknown as [number, number, number, number]` forces mutable
- **Root cause:** TypeScript readonly tuple vs Framer Motion's mutable tuple expectation

**Problematic code:**
```typescript
// Line 11
const customEasing = [0.25, 0.1, 0.25, 1] as const;

// Line 29 - forced type coercion
ease: customEasing as unknown as [number, number, number, number]
```

**Why this is dangerous:**
- `as unknown as T` is a "trust me" escape hatch
- Disables all type checking for this value
- Future changes won't be validated by TypeScript

**Reviewers identifying this:**
- TypeScript Review: P1 - Type assertion anti-pattern
- Pattern Recognition: P2 - Type coercion anti-pattern

## Proposed Solutions

### Option 1: Explicit Mutable Tuple Type

**Approach:** Define as mutable tuple from the start.

```typescript
// Directly declare as mutable tuple
const customEasing: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// Use directly without coercion
ease: customEasing
```

**Pros:**
- Type-safe
- No coercion needed
- Simple change

**Cons:**
- Less "defensive" than `as const`
- Could accidentally mutate (unlikely)

**Effort:** 5 minutes

**Risk:** Very Low

---

### Option 2: Create Typed Easing Constants File

**Approach:** Centralize all easing constants with proper types.

```typescript
// _lib/animation-constants.ts
export const EASING = {
  easeOut: [0, 0, 0.2, 1] as [number, number, number, number],
  easeInOut: [0.4, 0, 0.6, 1] as [number, number, number, number],
  custom: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
} satisfies Record<string, [number, number, number, number]>;

// In component
import { EASING } from '../_lib/animation-constants';
ease: EASING.custom
```

**Pros:**
- Centralized constants
- Reusable across components
- Type-safe
- Addresses pattern duplication too

**Cons:**
- New file to create
- Need to update other components

**Effort:** 1 hour (all files)

**Risk:** Low

---

### Option 3: Type Helper Function

**Approach:** Create a typed helper that validates at compile time.

```typescript
function easing<T extends [number, number, number, number]>(values: T): T {
  return values;
}

const customEasing = easing([0.25, 0.1, 0.25, 1]);
```

**Pros:**
- Validates structure at compile time
- Self-documenting

**Cons:**
- Over-engineering for simple arrays

**Effort:** 30 minutes

**Risk:** Low

## Recommended Action

Implement Option 2 (centralized constants):

1. Create `apps/web/app/home/(user)/_lib/animation-constants.ts`
2. Define all easing curves with proper tuple types
3. Update `page-transition.tsx`, `animated-reports-list.tsx`, `processing-screen.tsx`
4. Remove all `as const` + `as unknown as` patterns

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_components/page-transition.tsx` - uses `customEasing`
- `apps/web/app/home/(user)/_components/animated-reports-list.tsx` - defines `easeOut`
- `apps/web/app/home/(user)/_components/processing-screen.tsx` - defines `easeOut`, `easeInOut`, `easeIn`

**New file:**
- `apps/web/app/home/(user)/_lib/animation-constants.ts`

## Acceptance Criteria

- [ ] No `as unknown as` in animation files
- [ ] All easing arrays use explicit tuple type
- [ ] Centralized constants file created
- [ ] All components import from constants
- [ ] TypeScript compiles without errors
- [ ] Animations still work correctly

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by TypeScript and Pattern Recognition reviewers
- Traced pattern across 3 files
- Documented 3 solution approaches

**Learnings:**
- `as const` creates readonly tuples
- Framer Motion expects mutable `[number, number, number, number]`
- Direct tuple type annotation is simpler than const assertion
