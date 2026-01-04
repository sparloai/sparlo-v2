---
status: complete
priority: p1
issue_id: "181"
tags: [pdf, docraptor, reliability, timeout]
dependencies: []
---

# P1: DocRaptor Fetch Has No Timeout - Memory Leak Risk

## Problem Statement

The DocRaptor API fetch call has no `AbortController` timeout configured. The outer `Promise.race` timeout only rejects the promise but does **not abort the fetch request**, causing:
- Orphaned HTTP requests consuming memory/connections
- Concurrency slots remaining occupied during DocRaptor slowness
- Potential memory leaks in long-running containers

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx:94-111`

```typescript
// Current code - NO timeout on fetch
const response = await fetch(DOCRAPTOR_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...}),
  // ⚠️ No signal - can hang indefinitely
});
```

The outer `Promise.race` at line 246-253 triggers timeout error, but the fetch continues running in background until Next.js kills the request.

## Proposed Solutions

### Option 1: AbortController with Inner Timeout (Recommended)

Add AbortController to fetch call with 55s timeout (5s buffer before outer 60s timeout).

**Pros:**
- Properly cancels request on timeout
- Releases resources immediately
- Standard fetch timeout pattern

**Cons:**
- Minor code increase

**Effort:** Small (15 min)
**Risk:** Low

### Option 2: Remove Outer Promise.race, Use Only AbortController

Remove the outer timeout and rely solely on fetch abort signal.

**Pros:**
- Single timeout mechanism
- Simpler code

**Cons:**
- Less defense-in-depth

**Effort:** Small (15 min)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected files:**
- `apps/web/app/api/reports/[id]/pdf/route.tsx`

**Implementation:**
```typescript
async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const apiKey = process.env.DOCRAPTOR_API_KEY;
  if (!apiKey) {
    throw new Error('DOCRAPTOR_API_KEY environment variable is not set');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch(DOCRAPTOR_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({...}),
    });
    // ... rest of function
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('PDF generation timeout - DocRaptor did not respond');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

## Acceptance Criteria

- [ ] `AbortController` added to fetch call
- [ ] Timeout set to 55 seconds
- [ ] AbortError caught and converted to user-friendly message
- [ ] clearTimeout called in finally block
- [ ] Manual test: verify timeout behavior

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agents (security-sentinel, architecture-strategist)

**Actions:**
- Identified missing fetch timeout in DocRaptor integration
- Analyzed memory leak risk from orphaned requests
- Proposed AbortController solution

**Learnings:**
- Promise.race does not cancel the underlying promise
- AbortController is the standard pattern for fetch timeouts

### 2026-01-04 - Fixed

**By:** Claude Code

**Actions:**
- Added AbortController with 55s timeout (line 107-108, 114)
- Added signal to fetch request (line 118)
- Added catch block for AbortError → user-friendly message (lines 148-152)
- Added clearTimeout in finally block (line 155)

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx`
