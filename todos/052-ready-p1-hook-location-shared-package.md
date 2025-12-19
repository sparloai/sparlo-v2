---
status: ready
priority: p1
issue_id: "052"
tags: [architecture, hooks, reusability, accessibility]
dependencies: []
---

# High-Quality Hook in Wrong Location

## Problem Statement

The `usePrefersReducedMotion` hook is an excellent implementation using React 18+ `useSyncExternalStore` pattern, but it's buried in a route-specific directory where it cannot be discovered or reused by other parts of the application.

**Reusability Impact:** Other features needing reduced motion support cannot find this hook.

## Findings

- **File:** `apps/web/app/home/(user)/_hooks/use-prefers-reduced-motion.ts`
- **Should be:** `packages/ui/src/hooks/use-prefers-reduced-motion.ts`

**Hook quality assessment:**
```typescript
// Excellent implementation using React 18+ pattern
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**Strengths:**
- ✅ Uses `useSyncExternalStore` (concurrent mode safe)
- ✅ Proper SSR handling with server snapshot
- ✅ Clean subscription management
- ✅ Type-safe, well-documented

**Comparison with existing hook:**
```typescript
// packages/ui/src/hooks/use-mobile.tsx - Uses older pattern
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);
  React.useEffect(() => { /* ... */ }, []);
  return !!isMobile;
}
```

**Reviewers identifying this:**
- Architecture Review: P1 - Hook Placement Violates Reusability
- Pattern Recognition: Noted quality exceeds repository standards

## Proposed Solutions

### Option 1: Move to UI Package

**Approach:** Relocate hook to shared UI package.

```
packages/ui/src/hooks/
├── use-mobile.tsx (existing)
├── use-prefers-reduced-motion.ts (moved)
└── index.ts (barrel export)
```

**Changes:**
1. Move file to `packages/ui/src/hooks/use-prefers-reduced-motion.ts`
2. Update imports in consuming components
3. Add to barrel export

**Pros:**
- Proper location for shared hooks
- Discoverable by other features
- Follows monorepo conventions

**Cons:**
- Need to update 3 import paths

**Effort:** 30 minutes

**Risk:** Very Low

---

### Option 2: Move and Upgrade Existing Hook

**Approach:** Also upgrade `use-mobile.tsx` to same pattern.

```typescript
// Updated use-mobile.tsx with useSyncExternalStore
export function useIsMobile(): boolean {
  const subscribe = (callback: () => void) => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
  };

  const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT;
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

**Pros:**
- Establishes consistent hook pattern
- Both hooks use modern approach
- Better for concurrent mode

**Cons:**
- More changes
- Need to test existing uses of useIsMobile

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (move only) immediately, Option 2 as follow-up:

1. Move `use-prefers-reduced-motion.ts` to `packages/ui/src/hooks/`
2. Add barrel export in `packages/ui/src/hooks/index.ts`
3. Update imports in `animated-reports-list.tsx`, `page-transition.tsx`, `processing-screen.tsx`
4. Document in CLAUDE.md as exemplar pattern

## Technical Details

**Files to change:**
- Move: `apps/web/app/home/(user)/_hooks/use-prefers-reduced-motion.ts`
- To: `packages/ui/src/hooks/use-prefers-reduced-motion.ts`

**Update imports in:**
- `apps/web/app/home/(user)/_components/animated-reports-list.tsx`
- `apps/web/app/home/(user)/_components/page-transition.tsx`
- `apps/web/app/home/(user)/_components/processing-screen.tsx`

**New barrel export:**
```typescript
// packages/ui/src/hooks/index.ts
export { usePrefersReducedMotion } from './use-prefers-reduced-motion';
export { useIsMobile } from './use-mobile';
```

## Acceptance Criteria

- [ ] Hook moved to packages/ui/src/hooks/
- [ ] Barrel export created/updated
- [ ] All consuming components updated
- [ ] TypeScript compiles without errors
- [ ] Hook functionality unchanged
- [ ] Documentation updated with hook location

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by Architecture reviewer
- Compared with existing hooks in packages/
- Noted quality exceeds current standards

**Learnings:**
- useSyncExternalStore is preferred for external state
- Route-specific `_hooks` should be for truly local hooks
- Shared hooks belong in packages/ui
