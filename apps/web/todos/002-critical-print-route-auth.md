---
id: "002"
title: "Add authentication to print route"
priority: P1
status: completed
category: security
created: 2024-12-30
files:
  - app/api/reports/[id]/print/route.tsx
---

# Critical: Missing Authentication on Print Route

## Problem

The `/api/reports/[id]/print` route is missing the `enhanceRouteHandler` wrapper with `auth: true`. This means unauthenticated users can access the print endpoint directly.

While RLS protects the database query, the route should still require authentication to:
1. Maintain defense in depth
2. Prevent unauthorized access attempts from generating database queries
3. Provide consistent authentication across all report-related endpoints

## Current Code

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // No auth check!
  const { id } = await params;
  // ...
}
```

## Required Fix

Wrap with `enhanceRouteHandler`:

```typescript
import { enhanceRouteHandler } from '@kit/next/routes';

export const GET = enhanceRouteHandler(
  async function ({ params }) {
    const { id } = params as { id: string };
    // ...existing logic
  },
  { auth: true },
);
```

## Acceptance Criteria

- [ ] Print route uses `enhanceRouteHandler` with `auth: true`
- [ ] Unauthenticated requests receive 401 response
- [ ] Authenticated requests work as before
