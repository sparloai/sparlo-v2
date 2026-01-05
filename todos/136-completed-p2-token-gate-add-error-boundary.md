---
status: completed
priority: p2
issue_id: "136"
tags: [code-review, token-gating, reliability, error-handling]
dependencies: []
---

# Missing Error Boundary for Token Gate Page

## Problem Statement

The token gating page has no error boundary. If `requireUserInServerComponent()` or `checkUsageAllowed()` throws an uncaught error, users see a generic Next.js error page instead of a helpful message.

## Findings

**File:** `apps/web/app/home/(user)/reports/new/page.tsx`

```typescript
export default async function NewReportPage({ searchParams }: PageProps) {
  const user = await requireUserInServerComponent();  // Could throw
  const usage = await checkUsageAllowed(user.id, ...);  // Could throw
  // No error handling
}
```

**Scenarios that cause errors:**
- Supabase service unavailable
- Database connection timeout
- Invalid user session state
- RPC function failure

## Proposed Solutions

### Solution A: Add error.tsx (Recommended)
Create route-specific error boundary following Next.js conventions.

**Pros:** Follows Next.js patterns, automatic reset functionality
**Cons:** None
**Effort:** Small (30 minutes)
**Risk:** Low

```typescript
// apps/web/app/home/(user)/reports/new/error.tsx
'use client';

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-24">
        <h1 className="font-heading text-[42px] text-zinc-900">
          Something went wrong
        </h1>
        <p className="mt-4 text-zinc-600">
          Unable to load this page. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-8 bg-zinc-900 px-6 py-3 text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
```

## Recommended Action

Add error.tsx file to the route.

## Technical Details

**Affected Files:**
- Create: `apps/web/app/home/(user)/reports/new/error.tsx`

## Acceptance Criteria

- [ ] error.tsx created with branded styling
- [ ] Reset button works correctly
- [ ] Error message is user-friendly (no stack traces)
- [ ] Matches design system (monochrome, left border accent)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-02 | Created from architecture review | Important for reliability |

## Resources

- Next.js error handling docs
- Architecture review finding
