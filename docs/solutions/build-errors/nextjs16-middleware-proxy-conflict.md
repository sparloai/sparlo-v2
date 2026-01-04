---
title: "Next.js 16 middleware.ts vs proxy.ts Conflict"
date: 2026-01-04
category: build-errors
severity: high
tags: [nextjs, middleware, proxy, build]
affected_components:
  - apps/web/middleware.ts (removed)
  - apps/web/proxy.ts (kept)
prevention_documented: true
---

# Next.js 16 middleware.ts vs proxy.ts Conflict

## Problem Summary

Build fails when both `middleware.ts` and `proxy.ts` exist in Next.js 16 application.

## Symptoms

```
error: Cannot use both middleware.ts and proxy function
error: Middleware routing conflict
error: Multiple middleware handlers detected
```

## Root Cause

Next.js 16 introduced a new middleware pattern:

| Pattern | File | Export | Next.js Version |
|---------|------|--------|-----------------|
| Legacy | `middleware.ts` | `middleware()` | 13-15 |
| Modern | `proxy.ts` | `proxy()` | 16+ |

Both patterns cannot coexist. Having both files causes conflicts.

## Solution

### Remove middleware.ts

Next.js 16 uses `proxy.ts` exclusively:

```bash
rm apps/web/middleware.ts
```

### Verify proxy.ts Structure

The `proxy.ts` file should have:

```typescript
// apps/web/proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/((?!_next/static|_next/image|images|locales|assets|api/*).*)'],
};

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({});

  // CSRF protection
  // Route pattern matching
  // Admin middleware
  // Session management

  return response;
}
```

### Rebuild

```bash
pnpm build
```

## Prevention

### Document in CLAUDE.md

Added to project documentation:
- Next.js 16 uses `proxy.ts`, NOT `middleware.ts`
- Never create `middleware.ts` in apps/web

### Pre-commit Check

Could add a check:
```bash
if [ -f "apps/web/middleware.ts" ]; then
  echo "ERROR: middleware.ts conflicts with proxy.ts in Next.js 16"
  exit 1
fi
```

## Key Differences

| Aspect | middleware.ts | proxy.ts |
|--------|--------------|----------|
| Next.js version | 13-15 | 16+ |
| Export name | `middleware` | `proxy` |
| Config export | Same | Same |
| Edge runtime | Yes | Yes |

## Migration Notes

If migrating from middleware.ts:
1. Copy logic from `middleware()` to `proxy()`
2. Rename function export
3. Delete middleware.ts
4. Test all protected routes

## Related

- [Next.js 16 Migration Guide](https://nextjs.org/docs)
- Project config: `next.config.js`
