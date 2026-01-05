---
status: completed
priority: p2
issue_id: "167"
tags: [performance, memory-leak, react, analytics]
dependencies: []
---

# Missing Abort Signals in Analytics HTTP Requests

## Problem Statement

Server-side PostHog HTTP requests in Inngest functions and client-side tracking don't use AbortSignal, meaning requests can't be cancelled on component unmount or function timeout.

**Why it matters:**
- Memory leaks from pending requests
- Zombie requests consuming resources after timeout
- Potential for state updates on unmounted components

## Findings

### Performance Oracle Agent
The `posthog-server-service.ts` uses raw `fetch()` without an AbortController, meaning requests continue even if the Inngest function times out.

**Evidence:**
```typescript
// packages/analytics/src/posthog-server-service.ts
async function capture(event: string, properties: Record<string, unknown>): Promise<void> {
  await fetch(`${apiHost}/capture/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* ... */ }),
    // No signal! Request can't be cancelled
  });
}
```

## Proposed Solutions

### Option A: Add AbortSignal with timeout (Recommended)
**Pros:** Prevents zombie requests, respects Inngest timeouts
**Cons:** Slightly more code
**Effort:** Low (30 minutes)
**Risk:** Very Low

```typescript
async function capture(event: string, properties: Record<string, unknown>): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(`${apiHost}/capture/`, {
      method: 'POST',
      signal: controller.signal,
      // ...
    });
  } finally {
    clearTimeout(timeout);
  }
}
```

### Option B: Fire-and-forget with no await
**Pros:** Simplest, non-blocking
**Cons:** No error visibility, no timeout control
**Effort:** Very Low
**Risk:** Medium

## Recommended Action

Implement Option A with a 5-second timeout to match typical Inngest step timeouts.

## Technical Details

**Affected Files:**
- `packages/analytics/src/posthog-server-service.ts`

## Acceptance Criteria

- [ ] All analytics HTTP requests have timeout
- [ ] Requests abort cleanly on timeout
- [ ] Timeouts logged for debugging
- [ ] No hanging requests in Inngest functions

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-03 | Created from code review | HTTP requests need explicit timeouts |
