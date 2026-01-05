---
status: pending
priority: p2
issue_id: "184"
tags: [pdf, docraptor, reliability, retry]
dependencies: []
---

# P2: No Retry Logic for DocRaptor API Calls

## Problem Statement

DocRaptor API calls have zero retry logic. Any transient failure (network blip, DocRaptor 503, DNS hiccup) results in immediate user-facing error. This degrades user experience for recoverable failures.

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx:85-124`

Current error handling:
```typescript
// Single API call - no retry
const response = await fetch(DOCRAPTOR_API_URL, {...});

if (!response.ok) {
  throw new Error(`DocRaptor API error: ${response.status}`);
}
```

The codebase already has retry patterns elsewhere:
- `apps/web/lib/llm/security/error-handler.ts` - categorizes errors with `retryable` flag
- Inngest functions use retry configurations

## Proposed Solutions

### Option 1: Exponential Backoff Retry (Recommended)

Add retry wrapper with 2-3 attempts and exponential backoff.

```typescript
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  const { maxRetries = 2, baseDelay = 1000 } = options;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry auth/validation errors
      if (error instanceof Error && /40[013]/.test(error.message)) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError!;
}
```

**Pros:**
- Handles transient network failures gracefully
- Follows existing codebase patterns
- Minimal latency impact (most requests succeed first try)

**Cons:**
- Slightly longer worst-case latency
- More DocRaptor API calls on failures (cost impact minimal)

**Effort:** Medium (30 min)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected files:**
- `apps/web/app/api/reports/[id]/pdf/route.tsx`

## Acceptance Criteria

- [ ] Retry wrapper implemented with exponential backoff
- [ ] Max 2-3 retries configured
- [ ] Auth errors (401, 403) fail immediately (no retry)
- [ ] Logging added for retry attempts
- [ ] Test: verify retry behavior with mock failures

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agents (architecture-strategist, performance-oracle)

**Actions:**
- Identified missing retry logic
- Analyzed existing retry patterns in codebase
- Proposed exponential backoff solution

**Learnings:**
- Transient failures are common with external APIs
- Exponential backoff is standard pattern for resilience
