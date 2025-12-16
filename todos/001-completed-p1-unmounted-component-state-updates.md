---
status: completed
priority: p1
issue_id: "001"
tags: [code-review, race-condition, memory-leak, pr-22]
dependencies: []
---

# Unmounted Component State Updates

## Problem Statement

Multiple async operations in `useSparlo` hook don't check if component is still mounted before calling `setState`. This causes React warnings, memory leaks, and potential state corruption when users navigate away during pending operations.

**Why it matters:** Production React warnings, potential crashes, memory leaks affecting app performance.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Lines:** 379-640 (sendMessage), 652-724 (skipClarification), 110-205 (startPolling)

**Scenario:**
```typescript
// User sends message
await sendMessage("analyze this");
// While waiting for response, user clicks "New Conversation"
startNewConversation(); // Clears all refs
// Original async operation completes and tries to setState
setAppState('processing'); // Setting state on unmounted/reset component
```

**Impact Areas:**
- All `startTransition` async callbacks (lines 415-485, 518-525, 594-599, 618-623)
- Polling async operations
- API call responses

## Proposed Solutions

### Option A: Add Mounted Ref Guard (Recommended)

**Approach:** Add `mountedRef` pattern to guard all state updates

```typescript
const mountedRef = useRef(true);

useEffect(() => {
  return () => {
    mountedRef.current = false;
  };
}, []);

// In async operations:
if (!mountedRef.current) return;
setAppState('processing');
```

| Aspect | Assessment |
|--------|------------|
| Pros | Simple, standard React pattern, minimal code changes |
| Cons | Requires adding guard to all async callbacks |
| Effort | Small |
| Risk | Low |

### Option B: Use AbortController

**Approach:** Cancel in-flight requests when component unmounts

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

// In sendMessage:
abortControllerRef.current?.abort();
abortControllerRef.current = new AbortController();

try {
  const response = await sparloApi.chat(message, conversationId, {
    signal: abortControllerRef.current.signal
  });
} catch (err) {
  if (err.name === 'AbortError') return;
}
```

| Aspect | Assessment |
|--------|------------|
| Pros | Cancels network requests, saves bandwidth |
| Cons | Requires API changes to accept signal |
| Effort | Medium |
| Risk | Low |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Affected Components:**
- useSparlo hook
- All consuming components

## Acceptance Criteria

- [ ] Add `mountedRef` pattern to useSparlo hook
- [ ] Guard all `setState` calls in async callbacks
- [ ] Verify no React warnings about unmounted components
- [ ] Test rapid navigation during pending operations

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Multiple reviewers identified this issue |

## Resources

- **PR:** #22 - fix: prevent API chain from calling AN0 multiple times
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
