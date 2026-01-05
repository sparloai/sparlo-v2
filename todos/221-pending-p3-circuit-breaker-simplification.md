---
status: pending
priority: p3
issue_id: "221"
tags: [code-review, simplification]
dependencies: []
---

# Consider Simplifying or Removing Circuit Breaker

## Problem Statement

The circuit breaker implementation may be redundant because:
1. `isRedirectingRef` already prevents multiple redirects
2. A page navigation/reload breaks any loop naturally
3. The circuit breaker adds ~30 lines of complexity

## Findings

- `packages/supabase/src/hooks/use-auth-change-listener.ts:293` - `isRedirectingRef` already guards redirects
- `packages/supabase/src/hooks/use-auth-change-listener.ts:341-344` - Checked before any action
- Circuit breaker adds: 2 constants, 2 refs, 1 function, 4 checks (~30 lines)

**Key insight:** When `window.location.assign()` or `redirect()` is called:
1. `isRedirectingRef` is set to `true`
2. The page navigates away
3. On new page load, refs reset to defaults
4. The "loop" can only continue if redirect brings user back to same page

The circuit breaker protects against edge cases where:
- User is redirected back to the same page repeatedly
- Multiple rapid auth events fire before navigation completes

## Proposed Solutions

### Option 1: Keep Circuit Breaker (Current)

**Approach:** Keep as-is for defense-in-depth.

**Pros:**
- Extra safety layer
- Prevents 863-request scenarios
- Logs when issues occur

**Cons:**
- May be unnecessary complexity
- Masks underlying issues

**Effort:** 0 (no change)

**Risk:** None

---

### Option 2: Remove Circuit Breaker, Trust isRedirectingRef

**Approach:** Remove circuit breaker, rely solely on `isRedirectingRef`.

**Pros:**
- Simpler code (~30 lines removed)
- `isRedirectingRef` already prevents duplicate actions

**Cons:**
- Loses time-window protection
- No logging of potential loops
- Riskier if edge cases exist

**Effort:** 30 minutes

**Risk:** Medium (could reintroduce 429 loop)

---

### Option 3: Simplify to Boolean "Already Tripped" Flag

**Approach:** Replace time-windowed counter with simple boolean.

```typescript
const circuitBreakerTrippedRef = useRef(false);

// In each redirect case:
if (circuitBreakerTrippedRef.current) return;
if (redirectCountRef.current++ > 3) {
  circuitBreakerTrippedRef.current = true;
  console.error('[AuthListener] Circuit breaker tripped');
  return;
}
```

**Pros:**
- Simpler than time windows
- Still provides protection
- Clear "tripped" state

**Cons:**
- No auto-reset after time window
- Requires page reload to recover

**Effort:** 20 minutes

**Risk:** Low

## Recommended Action

**To be filled during triage.** Recommend keeping circuit breaker (Option 1) given the recent 863-request incident.

## Technical Details

**Affected files:**
- `packages/supabase/src/hooks/use-auth-change-listener.ts:66-69, 296-297, 356-375`

## Acceptance Criteria

- [ ] Decision documented
- [ ] If changed, no regression in auth flow
- [ ] No 429 errors in testing

## Work Log

### 2026-01-05 - Simplification Review

**By:** Claude Code (Code Simplicity Reviewer Agent)

**Actions:**
- Analyzed circuit breaker necessity
- Compared with existing isRedirectingRef guard
- Weighed complexity vs safety tradeoffs

## Notes

- The 429 incident that prompted this fix was severe (863 requests)
- Conservative approach: keep circuit breaker as safety net
- Consider removing if proven unnecessary over time
