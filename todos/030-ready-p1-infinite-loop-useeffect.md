---
status: ready
priority: p1
issue_id: "030"
tags: [performance, react, infinite-loop]
dependencies: []
---

# Fix Infinite Loop Risk in useEffect Dependencies

Including `fetchProgress` in dependency array can cause infinite re-renders.

## Problem Statement

The `useReportProgress` hook includes `fetchProgress` function in useEffect dependency array. If `fetchProgress` is recreated on each render (not wrapped in useCallback), this causes an infinite loop:

1. Component renders
2. `fetchProgress` is created (new reference)
3. useEffect detects dependency change
4. useEffect runs, potentially triggering state update
5. State update causes re-render
6. Go to step 1 (infinite loop)

## Findings

- File: `apps/web/app/home/(user)/_lib/use-report-progress.ts`
- The useEffect depends on `fetchProgress`
- If `fetchProgress` is not memoized with useCallback, each render creates new reference
- This triggers infinite effect executions

**Problematic pattern:**
```typescript
const fetchProgress = async () => {
  // Not wrapped in useCallback - new function on every render
};

useEffect(() => {
  fetchProgress();
}, [fetchProgress]);  // ❌ New reference every render
```

## Proposed Solutions

### Option 1: Wrap fetchProgress in useCallback (Recommended)

**Approach:** Memoize the function to maintain stable reference.

```typescript
const fetchProgress = useCallback(async () => {
  if (!reportId) return;

  const { data, error } = await supabase
    .from('sparlo_reports')
    .select('status, current_phase, phase_progress')
    .eq('id', reportId)
    .single();

  if (!mountedRef.current) return;
  if (!error && data) {
    setProgress({ ... });
  }
}, [reportId]);  // Only recreate when reportId changes

useEffect(() => {
  fetchProgress();
}, [fetchProgress]);  // ✅ Stable reference
```

**Pros:**
- Standard React pattern
- Clear dependency tracking
- Prevents infinite loops

**Cons:**
- Must be careful with useCallback deps

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Define fetchProgress Inside useEffect

**Approach:** Move function definition inside useEffect to avoid dependency.

```typescript
useEffect(() => {
  const fetchProgress = async () => {
    // ... implementation
  };

  fetchProgress();
}, [reportId]);  // Only depends on reportId
```

**Pros:**
- Simpler - no useCallback needed
- Clear that function only used in this effect

**Cons:**
- Function recreated on each effect run (minor)
- Can't call fetchProgress from outside

**Effort:** 15 minutes

**Risk:** Low

## Recommended Action

Implement Option 2 - Move function inside useEffect. This is simpler and the function is only used within the effect.

If `fetchProgress` needs to be callable from outside (e.g., manual refresh button), use Option 1 with useCallback.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-report-progress.ts`

**Impact of infinite loop:**
- Browser becomes unresponsive
- High CPU usage
- Memory exhaustion
- Poor user experience

## Acceptance Criteria

- [ ] `fetchProgress` either wrapped in useCallback OR defined inside useEffect
- [ ] No infinite render loops
- [ ] Effect only runs when `reportId` changes
- [ ] Manual testing confirms no console warnings

## Work Log

### 2025-12-16 - Performance Review Discovery

**By:** Claude Code (Performance Oracle Agent)

**Actions:**
- Identified potential infinite loop from unstable function reference
- Classified as P1 due to browser unresponsiveness risk
- Documented two fix approaches

**Learnings:**
- Functions in useEffect deps must have stable references (useCallback)
- Defining functions inside useEffect avoids dependency issues
- React Strict Mode helps detect these issues in development
