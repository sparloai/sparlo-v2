---
status: ready
priority: p1
issue_id: "049"
tags: [typescript, performance, react, animation]
dependencies: []
---

# Processing Screen Render-During-Render Anti-Pattern

## Problem Statement

`ProcessingScreen` component has a render-during-render anti-pattern in `useElapsedTime` hook that causes 4+ re-renders per second and violates React's concurrent mode rules. This creates performance issues and potential state tearing.

**Performance Impact:** 4+ unnecessary re-renders per second during processing state.

## Findings

- **File:** `apps/web/app/home/(user)/_components/processing-screen.tsx` (lines 90-98)
- **Pattern:** State update inside render phase (synchronous setState based on prop change)
- **Issue:** Timer interval triggers re-render → render checks createdAt → sets state → triggers another render

**Problematic code:**
```typescript
// Inside useElapsedTime hook (lines 90-98)
if (createdAt !== prevCreatedAt) {
  setPrevCreatedAt(createdAt);  // ❌ State update during render
  setElapsed(calculateElapsed(createdAt));
}
```

**Reviewers identifying this:**
- TypeScript Review: P1 - Render-during-render anti-pattern
- Performance Review: P1 - 4+ re-renders per second
- Code Simplicity Review: P2 - Over-engineered elapsed time tracking

## Proposed Solutions

### Option 1: Move to useEffect with Proper Dependencies

**Approach:** Use `useEffect` to respond to prop changes instead of render-time checks.

```typescript
function useElapsedTime(createdAt: string) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const start = new Date(createdAt);
      if (isNaN(start.getTime())) return;
      setElapsed(Math.floor((Date.now() - start.getTime()) / 1000));
    };

    calculate(); // Initial calculation
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  return elapsed;
}
```

**Pros:**
- Follows React rules of hooks
- Clear dependency tracking
- No render-time state updates

**Cons:**
- Slightly delayed initial calculation (next tick)

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Use useSyncExternalStore Pattern

**Approach:** Follow same pattern as `usePrefersReducedMotion` hook.

```typescript
function useElapsedTime(createdAt: string) {
  const subscribe = useCallback((callback: () => void) => {
    const interval = setInterval(callback, 1000);
    return () => clearInterval(interval);
  }, []);

  const getSnapshot = useCallback(() => {
    const start = new Date(createdAt);
    if (isNaN(start.getTime())) return 0;
    return Math.floor((Date.now() - start.getTime()) / 1000);
  }, [createdAt]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
```

**Pros:**
- Concurrent mode safe
- No useState/useEffect
- Consistent with other hooks in codebase

**Cons:**
- More complex implementation
- Overkill for simple timer

**Effort:** 1 hour

**Risk:** Low

## Recommended Action

Implement Option 1 (useEffect pattern):

1. Replace render-time prop comparison with `useEffect`
2. Add date validation before calculation
3. Ensure cleanup of interval on unmount/prop change
4. Add TypeScript narrowing for date parsing

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_components/processing-screen.tsx`

**Lines to change:** 83-116 (useElapsedTime hook)

**Related findings:**
- Issue 011 - unsafe type coercions (same area)

## Acceptance Criteria

- [ ] No state updates during render phase
- [ ] Timer updates at 1-second intervals correctly
- [ ] Proper cleanup on unmount
- [ ] Date validation prevents NaN issues
- [ ] Re-renders only on state/prop changes
- [ ] TypeScript compiles without errors
- [ ] No React strict mode warnings

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by TypeScript, Performance, and Simplicity reviewers
- Cross-referenced findings to confirm P1 severity
- Documented 2 solution approaches

**Learnings:**
- Render-during-render is subtle - code "works" but violates React rules
- Timer patterns should use useEffect or useSyncExternalStore
- Date parsing needs validation before arithmetic
