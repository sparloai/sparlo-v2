---
status: pending
priority: p3
issue_id: "018"
tags: [architecture, state-management, xstate, frontend]
dependencies: ["010", "013"]
---

# Add Explicit State Machine Pattern

Replace implicit state transitions with explicit state machine for better predictability.

## Problem Statement

The current state management uses:
- `appState` string with implicit transitions
- Multiple refs tracking sub-states
- Phase determination via `useMemo` with complex conditions

This makes it hard to:
- Understand all possible states
- Verify state transitions are valid
- Debug unexpected states
- Add new states safely

**Severity:** P3 - Architecture enhancement

## Findings

- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Current state handling:**
```typescript
// Implicit states via string
type AppState = 'input' | 'processing' | 'complete';

// Phase derived from multiple conditions (page.tsx lines 179-193)
const currentPhase = useMemo(() => {
  if (isLoading && pendingMessage && appState === 'input') {
    return 'analyzing';
  }
  if (clarificationQuestion && appState === 'input') {
    return 'clarifying';
  }
  if (appState === 'processing') {
    return 'processing';
  }
  // ... more conditions
}, [appState, isLoading, pendingMessage, clarificationQuestion, reportData]);
```

**Issues:**
- 'analyzing' and 'clarifying' are implicit sub-states of 'input'
- State transitions not validated
- Easy to end up in impossible states
- Adding new states requires updating multiple places

## Proposed Solutions

### Option 1: XState State Machine

**Approach:** Use XState for formal state machine

**Pros:**
- Formal state definitions
- Validated transitions
- Visual debugging tools
- Industry standard

**Cons:**
- New dependency
- Learning curve
- Migration effort

**Effort:** 8-10 hours

**Risk:** Medium

**Implementation:**
```typescript
import { createMachine, assign } from 'xstate';

const sparloMachine = createMachine({
  id: 'sparlo',
  initial: 'input',
  states: {
    input: {
      on: {
        SUBMIT: 'analyzing',
      },
    },
    analyzing: {
      on: {
        NEED_CLARIFICATION: 'clarifying',
        ANALYSIS_COMPLETE: 'processing',
      },
    },
    clarifying: {
      on: {
        CLARIFICATION_SUBMITTED: 'analyzing',
        SKIP_CLARIFICATION: 'processing',
      },
    },
    processing: {
      on: {
        REPORT_READY: 'complete',
        ERROR: 'error',
      },
    },
    complete: {
      on: {
        NEW_CONVERSATION: 'input',
      },
    },
    error: {
      on: {
        RETRY: 'input',
      },
    },
  },
});
```

---

### Option 2: Discriminated Union States

**Approach:** Use TypeScript discriminated unions for type-safe states

**Pros:**
- No new dependencies
- TypeScript enforces transitions
- Lighter weight than XState

**Cons:**
- Manual transition validation
- Less tooling
- More boilerplate

**Effort:** 4-5 hours

**Risk:** Low

**Implementation:**
```typescript
type SparloState =
  | { phase: 'input' }
  | { phase: 'analyzing'; pendingMessage: string }
  | { phase: 'clarifying'; question: ClarificationQuestion }
  | { phase: 'processing'; currentStep: string }
  | { phase: 'complete'; report: ReportData }
  | { phase: 'error'; error: Error };

function transition(state: SparloState, action: Action): SparloState {
  switch (state.phase) {
    case 'input':
      if (action.type === 'SUBMIT') {
        return { phase: 'analyzing', pendingMessage: action.message };
      }
      break;
    // ... other transitions
  }
  return state; // Invalid transition - no change
}
```

---

### Option 3: useReducer with State Validation

**Approach:** Add explicit state validation to existing useReducer

**Pros:**
- Minimal changes
- Already using useReducer
- Incremental improvement

**Cons:**
- Less formal than options 1/2
- State still implicit
- Manual validation

**Effort:** 2-3 hours

**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts` - Main state logic
- `apps/web/app/home/(user)/page.tsx` - Phase rendering

**Current states (explicit + implicit):**
1. `input` - User can type
2. `input + isLoading + pendingMessage` = `analyzing` (implicit)
3. `input + clarificationQuestion` = `clarifying` (implicit)
4. `processing` - Report generating
5. `complete` - Report ready
6. `error` - Something failed (currently at end of render)

**Dependencies:**
- Should be done after Issue 010 (ref reset) and 013 (ref consolidation)
- State machine could replace some ref tracking

## Resources

- **XState Docs:** https://xstate.js.org/docs/
- **TypeScript Discriminated Unions:** https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions

## Acceptance Criteria

- [ ] All states explicitly defined
- [ ] State transitions validated
- [ ] Invalid transitions handled gracefully
- [ ] Phase rendering simplified
- [ ] TypeScript catches invalid state access
- [ ] All tests pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Architecture Review Agent)

**Actions:**
- Mapped current implicit states
- Identified state transition points
- Evaluated XState vs discriminated unions
- Assessed migration complexity

**Learnings:**
- Current approach works but is fragile
- 'analyzing' and 'clarifying' should be explicit states
- XState provides best tooling but highest cost
- Discriminated unions are good middle ground

## Notes

- Lower priority - current approach works
- Would significantly improve maintainability
- Consider as part of larger refactor effort
- XState visualizer is excellent for debugging
- Dependencies on 010 and 013 because they clean up refs that state machine could replace
