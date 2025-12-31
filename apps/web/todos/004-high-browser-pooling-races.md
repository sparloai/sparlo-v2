---
id: "004"
title: "Fix browser pooling race conditions"
priority: P2
status: completed
category: reliability
created: 2024-12-30
files:
  - app/api/reports/[id]/pdf/route.tsx
---

# High: Browser Instance Race Conditions

## Problem

The current browser pooling implementation has race conditions when handling concurrent requests:

1. **No concurrency limit**: Multiple simultaneous PDF requests could exhaust memory
2. **Shared browser close**: One request might close the browser while another is using it
3. **Memory leaks**: Pages might not be properly cleaned up on errors

## Current Code Issues

```typescript
// No concurrency limit - can spawn unlimited pages
const page = await browser.newPage();

// No cleanup on error paths
try {
  await page.setContent(html, { ... });
  // If setContent fails, page may not be closed
} finally {
  await page.close(); // Good, but need to ensure browser isn't closed while pages exist
}
```

## Required Fix

Add a semaphore pattern for concurrency control:

```typescript
const MAX_CONCURRENT_PDFS = 3;
let activeRequests = 0;

async function acquireSlot(): Promise<boolean> {
  if (activeRequests >= MAX_CONCURRENT_PDFS) {
    return false;
  }
  activeRequests++;
  return true;
}

function releaseSlot(): void {
  activeRequests = Math.max(0, activeRequests - 1);
}

// In the route handler:
if (!await acquireSlot()) {
  return NextResponse.json(
    { error: 'Server busy, try again', code: 'BUSY' },
    { status: 503, headers: { 'Retry-After': '5' } }
  );
}

try {
  // Generate PDF
} finally {
  releaseSlot();
}
```

## Acceptance Criteria

- [ ] Add concurrency limit (suggest 3 concurrent PDFs)
- [ ] Return 503 with Retry-After when limit is reached
- [ ] Ensure page cleanup happens even on errors
- [ ] Add mutex/lock around browser instance creation
