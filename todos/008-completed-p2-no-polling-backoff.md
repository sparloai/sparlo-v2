---
status: completed
priority: p2
issue_id: "008"
tags: [code-review, performance, resilience, pr-22]
dependencies: []
---

# No Exponential Backoff for Polling Failures

## Problem Statement

When polling encounters errors, it continues at a fixed 3-second interval. This can overwhelm the server during outages and wastes client resources.

**Why it matters:** Server overload during issues, battery drain, no graceful degradation.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
**Lines:** 192-195, 202

**Current Code:**
```typescript
const POLLING_INTERVAL = 3000; // Fixed 3 seconds

catch (err) {
  console.error('Polling error:', err);
  // Don't stop polling on transient errors
  // BUT: continues at same 3-second rate!
}
```

**Issues:**
1. No backoff on repeated failures
2. No maximum retry limit
3. Polling continues even when tab is inactive
4. No circuit breaker pattern

## Proposed Solutions

### Option A: Exponential Backoff with Circuit Breaker (Recommended)

```typescript
const INITIAL_POLLING_INTERVAL = 3000;
const MAX_POLLING_INTERVAL = 30000;
const MAX_CONSECUTIVE_ERRORS = 5;

const pollingIntervalRef = useRef(INITIAL_POLLING_INTERVAL);
const consecutiveErrorsRef = useRef(0);

const poll = async () => {
  if (document.hidden) return; // Skip when tab inactive

  try {
    const status = await sparloApi.getStatus(backendConversationId);

    // Reset on success
    consecutiveErrorsRef.current = 0;
    pollingIntervalRef.current = INITIAL_POLLING_INTERVAL;

    // ... handle status
  } catch (err) {
    console.error('Polling error:', err);
    consecutiveErrorsRef.current++;

    // Exponential backoff: 3s, 6s, 12s, 24s, max 30s
    pollingIntervalRef.current = Math.min(
      INITIAL_POLLING_INTERVAL * Math.pow(2, consecutiveErrorsRef.current - 1),
      MAX_POLLING_INTERVAL
    );

    // Circuit breaker after N failures
    if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
      stopPolling();
      setError('Connection lost. Please refresh the page.');
      return;
    }

    // Restart interval with backoff
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = setInterval(poll, pollingIntervalRef.current);
    }
  }
};
```

| Aspect | Assessment |
|--------|------------|
| Pros | Graceful degradation, server protection, battery savings |
| Cons | More complex logic |
| Effort | Medium |
| Risk | Low |

### Option B: Add Page Visibility API

```typescript
const poll = async () => {
  // Skip polling when page is hidden
  if (document.hidden) return;

  // ... existing logic
};

// Resume immediately when page becomes visible
useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden && pollingRef.current) {
      poll(); // Immediate poll when returning to tab
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

| Aspect | Assessment |
|--------|------------|
| Pros | Saves resources when tab inactive |
| Cons | Doesn't address error backoff |
| Effort | Small |
| Risk | Low |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Backoff Schedule:**
- Error 1: 3s → 3s
- Error 2: 3s → 6s
- Error 3: 6s → 12s
- Error 4: 12s → 24s
- Error 5: 24s → 30s (max)
- Error 6+: Circuit breaker triggers

## Acceptance Criteria

- [ ] Polling interval increases on consecutive errors
- [ ] Circuit breaker stops polling after 5 failures
- [ ] Polling pauses when tab is inactive
- [ ] Interval resets on successful poll
- [ ] User notified when circuit breaker triggers

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Performance reviewer flagged |

## Resources

- **PR:** #22
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts:192-195`
