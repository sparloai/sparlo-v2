---
status: completed
priority: p1
issue_id: "005"
tags: [code-review, race-condition, performance, pr-22]
dependencies: []
---

# Polling Race Condition with Rapid Conversation Switches

## Problem Statement

When users rapidly switch between conversations, multiple polling intervals can be created because `startPolling` clears the interval but in-flight async operations may continue. This causes duplicate API calls, state thrashing, and potential memory leaks.

**Why it matters:** Multiple active polls cause API overload, inconsistent UI state, and wasted resources.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
**Lines:** 110-205 (startPolling), 232-307 (selectConversation)

**Current Code Issues:**
```typescript
const startPolling = useCallback(
  (backendConversationId: string, reportId: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    conversationIdRef.current = backendConversationId;

    const poll = async () => {
      if (conversationIdRef.current !== backendConversationId) return;
      // ... async work that may still execute
    };

    poll();
    pollingRef.current = setInterval(poll, POLLING_INTERVAL);
  },
  [], // Empty dependencies - also problematic
);
```

**Race Scenario:**
1. User selects Conv-A → `startPolling("backend-a")` called
2. User IMMEDIATELY selects Conv-B (before first poll executes)
3. `clearInterval` clears reference, but in-flight poll from A continues
4. Both polls may update state for wrong conversation

**Additional Issue:** Empty dependency array means `startTransition` captured from initial render.

## Proposed Solutions

### Option A: Polling Session ID Pattern (Recommended)

```typescript
const pollingSessionRef = useRef(0);

const startPolling = useCallback((backendConversationId: string, reportId: string) => {
  if (pollingRef.current) {
    clearInterval(pollingRef.current);
    pollingRef.current = null;
  }

  const sessionId = ++pollingSessionRef.current;
  conversationIdRef.current = backendConversationId;

  const poll = async () => {
    // Check session ID instead of just conversation ID
    if (pollingSessionRef.current !== sessionId) return;

    try {
      const status = await sparloApi.getStatus(backendConversationId);

      // Double-check after async operation
      if (pollingSessionRef.current !== sessionId) return;

      // ... handle status
    } catch (err) {
      if (pollingSessionRef.current !== sessionId) return;
      console.error('Polling error:', err);
    }
  };

  poll();
  pollingRef.current = setInterval(poll, POLLING_INTERVAL);
}, [startTransition]); // Add missing dependency
```

| Aspect | Assessment |
|--------|------------|
| Pros | Simple, reliable, handles all race cases |
| Cons | Slightly more complex check |
| Effort | Small |
| Risk | Low |

### Option B: AbortController Pattern

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const startPolling = useCallback((backendConversationId: string, reportId: string) => {
  // Abort any in-flight requests
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  const poll = async () => {
    try {
      const status = await sparloApi.getStatus(backendConversationId, {
        signal: abortControllerRef.current?.signal
      });
      // ...
    } catch (err) {
      if (err.name === 'AbortError') return;
      // ...
    }
  };
  // ...
}, []);
```

| Aspect | Assessment |
|--------|------------|
| Pros | Cancels network requests, saves bandwidth |
| Cons | Requires API layer changes |
| Effort | Medium |
| Risk | Low |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Changes Required:**
1. Add `pollingSessionRef` to track polling sessions
2. Add session ID check in `poll` function
3. Add `startTransition` to dependency array
4. Double-check session after each async operation

## Acceptance Criteria

- [ ] Only one polling interval active at any time
- [ ] Rapid conversation switches don't cause duplicate polls
- [ ] No stale state updates from old polls
- [ ] `startPolling` has correct dependencies

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Race condition and performance reviewers both flagged |

## Resources

- **PR:** #22
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts:110-205`
