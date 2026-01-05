---
status: pending
priority: p2
issue_id: "213"
tags: [code-review, performance, react]
dependencies: []
---

# Debounce Pattern Matching in Form Detection Indicators

## Problem Statement

Pattern matching functions for detection indicators run on every keystroke without debouncing or memoization. This causes 93 regex operations per keystroke (54 in Technical form + 39 in DD form), leading to:
- 465 regex operations per second during normal typing (60 WPM)
- Input lag on slower devices
- Battery drain from constant CPU usage

## Findings

- **Technical Form:** `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx` (lines 61-131)
  - `hasProblemStatement()` - 18 patterns
  - `hasConstraints()` - 18 patterns
  - `hasSuccessCriteria()` - 18 patterns

- **DD Form:** `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx` (lines 54-110)
  - `hasCompanyInfo()` - 13 patterns
  - `hasTechClaims()` - 17 patterns
  - `hasProductDetails()` - 10 patterns

- All detection functions called on every render in the JSX
- No useMemo or debounce applied
- Patterns are recompiled on each call (though JS caches compiled regex)

## Proposed Solutions

### Option 1: Debounce with useDeferredValue

**Approach:** Use React's useDeferredValue to defer pattern matching.

```typescript
const deferredText = useDeferredValue(problemText);
const detectionResults = useMemo(() => ({
  hasProblem: hasProblemStatement(deferredText),
  hasConstraints: hasConstraints(deferredText),
  hasSuccess: hasSuccessCriteria(deferredText),
}), [deferredText]);
```

**Pros:**
- React-native solution
- Automatically handles priority

**Cons:**
- May have slight delay in indicator updates

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Custom Debounce Hook

**Approach:** Use lodash.debounce or custom useDebounce hook with 300ms delay.

```typescript
const debouncedText = useDebounce(problemText, 300);
```

**Pros:**
- Fine-grained control over timing
- Well-tested pattern

**Cons:**
- Additional dependency or hook code

**Effort:** 30 minutes

**Risk:** Low

---

### Option 3: Memoize Only (No Debounce)

**Approach:** Wrap detection results in useMemo.

```typescript
const detectionResults = useMemo(() => ({
  hasProblem: hasProblemStatement(problemText),
  // ...
}), [problemText]);
```

**Pros:**
- Simplest change
- Still runs once per text change (not per render)

**Cons:**
- Still runs on every keystroke (but only once per keystroke)

**Effort:** 15 minutes

**Risk:** Low

## Recommended Action

*To be filled during triage.*

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx:514-527`
- `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx:392-405`

**Related components:**
- DetectionIndicator component in both forms (identical implementation)

## Acceptance Criteria

- [ ] Pattern matching debounced or memoized
- [ ] No perceptible input lag during fast typing
- [ ] Detection indicators still update (within 300ms)
- [ ] Tests pass
- [ ] CPU usage reduced during typing (verify with DevTools)

## Work Log

### 2026-01-04 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified performance issue during review
- Calculated: 93 regex ops/keystroke × 5 keystrokes/sec = 465 ops/sec
- Verified detection functions run on every render

**Learnings:**
- React re-renders on every keystroke for controlled inputs
- Pattern matching should be debounced for user input

## Notes

- This is a nice-to-have optimization, not critical
- Consider combining with code duplication fix (extract shared detection logic)
- Could also consider extracting DetectionIndicator to shared component
