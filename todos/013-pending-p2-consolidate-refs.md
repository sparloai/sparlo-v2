---
status: pending
priority: p2
issue_id: "013"
tags: [react, state-management, refactoring, frontend]
dependencies: ["010"]
---

# Consolidate 12 Refs into Grouped Objects

The use-sparlo.ts hook uses 12 separate refs that should be consolidated into 5 logical groupings.

## Problem Statement

The `use-sparlo.ts` hook has grown to use 12 separate refs:
- Hard to track which refs need cleanup
- Easy to miss resetting refs (see Issue 010)
- Mental overhead understanding relationships
- No clear ownership/grouping

**Severity:** P2 - Maintainability concern

## Findings

- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Current refs (12):**
1. `messageProcessingRef` - Lock for message handling
2. `subsequentMessageSentRef` - Clarification flow tracking
3. `lastMessageTimeRef` - Timing for debounce
4. `pollingSessionRef` - Polling lifecycle
5. `pollingIntervalRef` - Interval ID for polling
6. `circuitBreakerRef` - Failure tracking
7. `abortControllerRef` - Request cancellation
8. `retryCountRef` - Retry tracking
9. `mountedRef` - Component lifecycle
10. `conversationIdRef` - Active conversation tracking
11. `streamingRef` - SSE stream state
12. `lastErrorRef` - Error deduplication

**Proposed groupings (5):**
1. **lifecycleRefs:** mountedRef, conversationIdRef
2. **messageRefs:** messageProcessingRef, subsequentMessageSentRef, lastMessageTimeRef
3. **pollingRefs:** pollingSessionRef, pollingIntervalRef, circuitBreakerRef
4. **networkRefs:** abortControllerRef, retryCountRef, streamingRef
5. **errorRefs:** lastErrorRef

## Proposed Solutions

### Option 1: Grouped Ref Objects

**Approach:** Replace individual refs with grouped objects

**Pros:**
- Single reset point per group
- Clear logical relationships
- Easier to add new refs
- Better code organization

**Cons:**
- Refactoring required
- Object access slightly more verbose
- Must be careful with mutations

**Effort:** 2-3 hours

**Risk:** Low (after Issue 010 is done)

**Implementation:**
```typescript
const lifecycleRefs = useRef({
  mounted: false,
  conversationId: null as string | null,
});

const messageRefs = useRef({
  processing: false,
  subsequentSent: false,
  lastTime: 0,
});

const pollingRefs = useRef({
  session: null as string | null,
  interval: null as NodeJS.Timeout | null,
  circuitBreaker: { failures: 0, lastFailure: 0, isOpen: false },
});

// Reset all message refs at once
const resetMessageRefs = useCallback(() => {
  messageRefs.current = {
    processing: false,
    subsequentSent: false,
    lastTime: 0,
  };
}, []);
```

---

### Option 2: Custom useRefs Hook

**Approach:** Create custom hook that manages ref groups with reset functions

**Pros:**
- Encapsulates reset logic
- Reusable pattern
- TypeScript can infer types

**Cons:**
- More abstraction
- Must understand hook internals

**Effort:** 3-4 hours

**Risk:** Low

---

### Option 3: State Machine with Context

**Approach:** Replace refs with explicit state machine (XState or custom)

**Pros:**
- Formal state transitions
- Easier to reason about
- Better debugging

**Cons:**
- Significant refactor
- Learning curve
- May be overkill

**Effort:** 8-10 hours

**Risk:** High

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts` - Main hook
- All refs are internal, no external API changes

**Dependencies:**
- Should be done AFTER Issue 010 (ref reset fixes)
- Issue 010 can use current refs, then this consolidates

**Migration strategy:**
1. Add grouped refs alongside existing
2. Update usages one group at a time
3. Remove old refs
4. Add reset functions

## Resources

- **React useRef:** https://react.dev/reference/react/useRef
- **State machines in React:** https://xstate.js.org/docs/

## Acceptance Criteria

- [ ] 12 refs consolidated to 5 grouped refs
- [ ] Each group has reset function
- [ ] All existing functionality preserved
- [ ] Ref cleanup in effects uses group reset
- [ ] TypeScript types for all ref groups
- [ ] All tests pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Simplicity Review Agent + Architecture Agent)

**Actions:**
- Cataloged all 12 refs in use-sparlo.ts
- Analyzed logical relationships between refs
- Proposed 5 groupings based on functionality
- Assessed migration complexity

**Learnings:**
- Refs grew organically as features were added
- pollingRefs group already partially exists (good pattern)
- Some refs are cleanup-related, others are state-tracking
- Grouping makes reset logic much cleaner

## Notes

- Dependency on Issue 010: That issue fixes immediate bugs, this improves maintainability
- Can be done incrementally - one group at a time
- Consider if XState is worth the complexity (probably not for this case)
- Architecture agent noted 12+ refs as code smell
