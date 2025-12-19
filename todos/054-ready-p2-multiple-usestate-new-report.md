---
status: ready
priority: p2
issue_id: "054"
tags: [react, state-management, typescript]
dependencies: []
---

# Multiple useState Hooks in New Report Page

## Problem Statement

The `new/page.tsx` component uses 6 separate `useState` calls for related form state. Per CLAUDE.md: "Do not write many (such as 4-5) separate useState, prefer single state object."

**Maintainability Impact:** State updates could be out of sync; harder to reason about transitions.

## Findings

- **File:** `apps/web/app/home/(user)/reports/new/page.tsx` (lines 25-30)

**Current implementation:**
```typescript
const [phase, setPhase] = useState<PagePhase>('input');
const [challengeText, setChallengeText] = useState('');
const [reportId, setReportId] = useState<string | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);
const [showRefusalWarning, setShowRefusalWarning] = useState(false);
```

**Problems:**
1. 6 separate state calls (exceeds CLAUDE.md guidance)
2. Related state split across variables
3. Phase transitions require multiple setters
4. Harder to implement state machine

**Reviewers identifying this:**
- TypeScript Review: P2 - Multiple useState hooks
- Pattern Recognition: P2 - State management anti-pattern

## Proposed Solutions

### Option 1: Combined State Object

**Approach:** Merge related state into single object.

```typescript
interface FormState {
  phase: PagePhase;
  challengeText: string;
  reportId: string | null;
  isSubmitting: boolean;
  error: string | null;
  showRefusalWarning: boolean;
}

const [state, setState] = useState<FormState>({
  phase: 'input',
  challengeText: '',
  reportId: null,
  isSubmitting: false,
  error: null,
  showRefusalWarning: false,
});

// Usage
setState(prev => ({ ...prev, isSubmitting: true }));
```

**Pros:**
- Single source of truth
- Atomic updates possible
- Follows CLAUDE.md guidance

**Cons:**
- More verbose updates
- Need to spread previous state

**Effort:** 1 hour

**Risk:** Low

---

### Option 2: useReducer Pattern

**Approach:** Use reducer for complex state transitions.

```typescript
type Action =
  | { type: 'START_SUBMIT' }
  | { type: 'SUBMIT_SUCCESS'; reportId: string }
  | { type: 'SUBMIT_ERROR'; error: string }
  | { type: 'SET_CHALLENGE'; text: string };

const [state, dispatch] = useReducer(formReducer, initialState);
```

**Pros:**
- Explicit state transitions
- Better for complex flows
- Easier to test

**Cons:**
- More boilerplate
- Learning curve

**Effort:** 2 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (combined state object):

1. Create `FormState` interface
2. Merge all useState into single state object
3. Update all state updates to use functional updates
4. Consider Option 2 in future if complexity grows

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/new/page.tsx`

**State transitions to handle:**
- Input → Submitting → Processing/Error
- Processing → Complete
- Error → Input (retry)

## Acceptance Criteria

- [ ] Single useState for form state
- [ ] All state properties accessible
- [ ] State transitions work correctly
- [ ] Form submission still works
- [ ] Error handling unchanged
- [ ] TypeScript types preserved

## Work Log

### 2025-12-18 - Initial Discovery

**By:** Claude Code (Parallel Review Agents)

**Actions:**
- Identified by TypeScript and Pattern Recognition reviewers
- Counted 6 useState hooks
- Referenced CLAUDE.md guidance

**Learnings:**
- Multiple useState often indicates need for state object
- Phase-based UIs benefit from combined state
- useReducer is overkill for simple forms
