---
status: complete
priority: p2
issue_id: "220"
tags: [code-review, refactoring, typescript]
dependencies: []
---

# Extract Circuit Breaker Function to Module Level

## Problem Statement

The `checkAndIncrementRedirectCount` function is defined inside the `onAuthStateChange` callback, which:
1. Recreates the function on every auth event
2. Makes it impossible to unit test in isolation
3. Breaks consistency with other utility functions in the file (all at module level)

## Findings

- `packages/supabase/src/hooks/use-auth-change-listener.ts:356-375` - Function defined inside callback
- All other utility functions (`isAppSubdomain`, `isPublicPathOnSubdomain`, `getMainDomainAuthUrl`, etc.) are at module level (lines 94-180)
- Function uses refs as closures - can be refactored to take refs as parameters

## Proposed Solutions

### Option 1: Extract to Module-Level Pure Function (Recommended)

**Approach:** Move function outside callback, pass refs as parameters.

```typescript
// At module level (after line 180)
function checkRedirectAllowed(
  redirectCountRef: React.MutableRefObject<number>,
  lastRedirectTimeRef: React.MutableRefObject<number>,
): boolean {
  const now = Date.now();
  if (now - lastRedirectTimeRef.current < REDIRECT_WINDOW_MS) {
    redirectCountRef.current++;
    if (redirectCountRef.current > MAX_REDIRECTS_IN_WINDOW) {
      console.error('[AuthListener] Circuit breaker triggered');
      return false;
    }
  } else {
    redirectCountRef.current = 1;
  }
  lastRedirectTimeRef.current = now;
  return true;
}
```

**Pros:**
- Testable in isolation
- Consistent with codebase patterns
- No recreation overhead
- Clear dependencies (explicit params)

**Cons:**
- Slightly more verbose call sites

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: useCallback at Hook Level

**Approach:** Keep function in hook but use `useCallback` to memoize.

**Pros:**
- Stays within hook context
- Still benefits from memoization

**Cons:**
- Still not testable in isolation
- Less consistent with file patterns

**Effort:** 15 minutes

**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `packages/supabase/src/hooks/use-auth-change-listener.ts:356-375`

## Resources

- **TypeScript Review:** Function should be at module level for consistency

## Acceptance Criteria

- [ ] Function extracted to module level
- [ ] Takes refs as explicit parameters
- [ ] Has proper JSDoc documentation
- [ ] All call sites updated
- [ ] Typecheck passes

## Work Log

### 2026-01-05 - Code Quality Review

**By:** Claude Code (TypeScript Reviewer Agent)

**Actions:**
- Identified inline function pattern violation
- Compared with other utility functions in file
- Proposed extraction approach
