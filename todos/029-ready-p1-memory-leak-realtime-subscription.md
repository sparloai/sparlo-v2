---
status: ready
priority: p1
issue_id: "029"
tags: [performance, react, memory-leak, realtime]
dependencies: []
---

# Fix Memory Leak in Realtime Subscription Hook

Race condition in cleanup function causes memory leaks and state updates after unmount.

## Problem Statement

The `useReportProgress` hook has a race condition in its cleanup function that can cause:
- Memory leaks from uncleaned subscriptions
- React warnings about state updates after unmount
- Potential UI inconsistencies

The issue: `mountedRef.current = false` runs after the cleanup starts, creating a window where state updates can still occur.

## Findings

- File: `apps/web/app/home/(user)/_lib/use-report-progress.ts`
- Lines: ~180-205 (cleanup function)
- The `mountedRef` pattern is correct but cleanup order is wrong

**Current vulnerable pattern:**
```typescript
return () => {
  // ❌ Race condition: cleanup starts but mountedRef still true
  if (channel) supabase.removeChannel(channel);
  mountedRef.current = false;  // Too late - state updates may have fired
};
```

**Correct pattern:**
```typescript
return () => {
  // ✅ Set flag FIRST, before any async cleanup
  mountedRef.current = false;
  if (channel) supabase.removeChannel(channel);
};
```

## Proposed Solutions

### Option 1: Fix Cleanup Order (Recommended)

**Approach:** Set `mountedRef.current = false` as the first line in cleanup.

```typescript
useEffect(() => {
  let channel: RealtimeChannel | null = null;
  mountedRef.current = true;

  const initialize = async () => {
    // ... subscription setup
  };

  initialize();

  return () => {
    mountedRef.current = false;  // ✅ First!
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
}, [reportId]);
```

**Pros:**
- Simple fix
- Follows React best practices
- No additional dependencies

**Cons:**
- None

**Effort:** 15 minutes

**Risk:** Low

---

### Option 2: Use AbortController Pattern

**Approach:** Use AbortController for more robust cleanup.

```typescript
useEffect(() => {
  const abortController = new AbortController();

  const initialize = async () => {
    if (abortController.signal.aborted) return;
    // ... setup with abort checks
  };

  return () => {
    abortController.abort();
    // ... channel cleanup
  };
}, [reportId]);
```

**Pros:**
- Standard web API
- Works for fetch requests too
- More explicit cancellation

**Cons:**
- Slightly more code
- Overkill for this use case

**Effort:** 30 minutes

**Risk:** Low

## Recommended Action

Implement Option 1 - Simply reorder the cleanup function:

1. Move `mountedRef.current = false` to first line of cleanup
2. Add null check for supabase client
3. Consider adding explicit channel cleanup logging for debugging

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-report-progress.ts` (lines ~180-205)

**Related files that may have similar issues:**
- Any hook using Supabase realtime subscriptions
- Components with async state updates

## Acceptance Criteria

- [ ] `mountedRef.current = false` is first line in cleanup
- [ ] No React warnings about state updates after unmount
- [ ] Memory leak resolved (verify with React DevTools)
- [ ] Subscription properly cleaned up on unmount

## Work Log

### 2025-12-16 - Performance Review Discovery

**By:** Claude Code (Performance Oracle Agent)

**Actions:**
- Identified race condition in cleanup function
- Classified as P1 due to memory leak potential
- Documented simple fix pattern

**Learnings:**
- Always set cancellation flags before async cleanup operations
- React cleanup functions run synchronously but may trigger async callbacks
- Order matters in cleanup functions
