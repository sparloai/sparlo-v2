---
status: pending
priority: p1
issue_id: "225"
tags:
  - code-review
  - animation
  - ssr
  - hydration
  - react
dependencies: []
---

# SSR/Hydration Mismatch in Animation Hooks

## Problem Statement

Two animation hooks read browser-only values during their initial render, causing React hydration mismatches between server and client. This results in console warnings in development and potential UI flicker in production.

**Why it matters**: Hydration mismatches cause React warnings that clutter the console, and can cause brief visual glitches where animations flash incorrectly on page load.

## Findings

### Evidence

**File 1**: `/apps/web/lib/hooks/use-prefers-reduced-motion.ts` (Lines 27-31)
```typescript
const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
});
```

- Server: Returns `false` (window undefined)
- Client (with reduced motion enabled): Returns `true`
- **Result**: Hydration mismatch on clients with reduced motion preference

**File 2**: `/apps/web/lib/hooks/use-adaptive-spring.ts` (Lines 39-45)
```typescript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

if (isMobile) {
  return SPRING.mobile;
}

return SPRING.smooth;
```

- Server: Returns `SPRING.smooth` (window undefined)
- Client (mobile): Returns `SPRING.mobile`
- **Result**: Hydration mismatch on mobile devices

### Agent Reports

- **TypeScript Reviewer**: Flagged as HIGH - "This causes a hydration mismatch: Server returns false, Client initializer returns true. This will throw hydration warnings in React strict mode."

- **Performance Oracle**: Flagged as HIGH - "SSR/Hydration mismatch on mobile devices. Initial state may flash."

## Proposed Solutions

### Solution 1: Defer to useEffect (Recommended)
**Description**: Start with safe default values and update in useEffect after hydration.

**Pros**:
- Eliminates hydration mismatch completely
- React-compliant pattern
- Works with React strict mode

**Cons**:
- Brief flash of non-preferred state on first render
- Slightly delayed preference detection

**Effort**: Small (30 minutes)
**Risk**: Low

**Implementation for use-prefers-reduced-motion.ts**:
```typescript
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

**Implementation for use-adaptive-spring.ts**:
```typescript
export function useAdaptiveSpring(): Transition {
  const prefersReduced = usePrefersReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (prefersReduced) {
    return REDUCED_MOTION_TRANSITION;
  }

  return isMobile ? SPRING.mobile : SPRING.smooth;
}
```

### Solution 2: Use useSyncExternalStore
**Description**: Use React 18's useSyncExternalStore for proper external state synchronization.

**Pros**:
- React 18+ recommended pattern
- Better concurrent mode support
- Already implemented in `/apps/web/app/app/_hooks/use-prefers-reduced-motion.ts`

**Cons**:
- More complex implementation
- May still have initial flash

**Effort**: Medium (1 hour)
**Risk**: Low

### Solution 3: CSS-First Approach
**Description**: Rely on CSS `prefers-reduced-motion` media query instead of JS hook.

**Pros**:
- No hydration issues
- Instant preference application
- Better performance

**Cons**:
- Less flexible for JS-driven animations
- Can't use for conditional spring configs

**Effort**: Medium (2 hours)
**Risk**: Medium (architecture change)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

### Affected Files
- `apps/web/lib/hooks/use-prefers-reduced-motion.ts`
- `apps/web/lib/hooks/use-adaptive-spring.ts`
- Any components using these hooks

### Testing Required
- Verify no hydration warnings in browser console
- Test with `prefers-reduced-motion: reduce` enabled
- Test on mobile viewport sizes
- Test page refresh behavior

## Acceptance Criteria

- [ ] No React hydration warnings in console
- [ ] Reduced motion preference is respected
- [ ] Mobile spring config is applied on mobile devices
- [ ] Window resize updates mobile detection

## Work Log

| Date | Action | Outcome | Learnings |
|------|--------|---------|-----------|
| 2026-01-09 | Code review identified | Found hydration mismatches | useState initializer runs on server |

## Resources

- [React Hydration documentation](https://react.dev/reference/react-dom/client/hydrateRoot)
- [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore)
