---
status: completed
priority: p2
issue_id: "007"
tags: [code-review, error-handling, security, pr-22]
dependencies: []
---

# Inconsistent Error Handling

## Problem Statement

Error handling throughout `useSparlo` is inconsistent - some errors log only, others set state, some expose backend details to users. This creates security risks and poor UX.

**Why it matters:** Information leakage, inconsistent user experience, difficult debugging.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Pattern 1: Stop polling and set error state**
```typescript
// Lines 156-159
catch (err) {
  console.error('Failed to fetch report:', err);
  setError('Failed to load report. Please try again.');
}
```

**Pattern 2: Log only, continue polling**
```typescript
// Lines 192-195
catch (err) {
  console.error('Polling error:', err);
  // Don't stop polling on transient errors
}
```

**Pattern 3: Type-specific handling**
```typescript
// Lines 294-304
catch (err) {
  if (err instanceof ApiError && err.status === 404) {
    setError('This conversation is no longer available.');
  } else {
    console.error('Failed to load conversation:', err);
    setError('Failed to load conversation');
  }
}
```

**Pattern 4: Direct error message exposure**
```typescript
// Lines 166, 291, 493-494
setError(status.message || 'An error occurred during processing');
setError(err instanceof Error ? err.message : 'Failed to send message');
```

**Security Risk:** Backend error messages may expose system internals, stack traces, or database schema.

## Proposed Solutions

### Option A: Centralized Error Handler (Recommended)

```typescript
function getSafeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404: return 'Resource not found';
      case 403: return 'Access denied';
      case 429: return 'Too many requests. Please try again later.';
      case 500: return 'Server error. Please try again.';
      default: return 'An error occurred. Please try again.';
    }
  }

  // Log full error for debugging (would go to error tracking in production)
  console.error('[useSparlo] Error:', error);

  // Return generic message to user
  return 'An error occurred. Please try again.';
}

const handleError = (
  err: unknown,
  options: {
    stopPolling?: boolean;
    userMessage?: string;
    logPrefix?: string;
  } = {}
) => {
  if (options.stopPolling) {
    stopPolling();
  }

  console.error(options.logPrefix || '[useSparlo]', err);
  setError(options.userMessage || getSafeErrorMessage(err));
};
```

| Aspect | Assessment |
|--------|------------|
| Pros | Consistent UX, no info leakage, centralized logic |
| Cons | Need to update all error sites |
| Effort | Medium |
| Risk | Low |

### Option B: Error Circuit Breaker for Polling

```typescript
const pollingErrorCountRef = useRef(0);
const MAX_POLLING_ERRORS = 5;

// In poll catch block:
catch (err) {
  pollingErrorCountRef.current++;

  if (pollingErrorCountRef.current >= MAX_POLLING_ERRORS) {
    stopPolling();
    setError('Connection lost. Please refresh the page.');
  }
  // Otherwise continue polling
}

// Reset on success:
pollingErrorCountRef.current = 0;
```

| Aspect | Assessment |
|--------|------------|
| Pros | Prevents infinite polling on persistent failures |
| Cons | Only addresses polling errors |
| Effort | Small |
| Risk | Low |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Error Types to Handle:**
1. Network errors (transient)
2. API errors (4xx, 5xx)
3. Validation errors
4. Auth errors (401)
5. Not found errors (404)

**User-Facing Messages:**
- Should be helpful but not expose internals
- Should suggest actionable next steps
- Should be consistent across the app

## Acceptance Criteria

- [ ] All errors use consistent handling pattern
- [ ] No backend error messages exposed to users
- [ ] Polling has circuit breaker after N failures
- [ ] Error messages are user-friendly and actionable
- [ ] Errors logged with context for debugging

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Security reviewer flagged info leakage as P1 |

## Resources

- **PR:** #22
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
