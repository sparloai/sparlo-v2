---
title: "App Route Migration - Cherry-Pick Import Path Conflicts"
category: build-errors
tags: [app-router, cherry-pick, merge-conflicts, import-paths, nextjs, railway, tsconfig, middleware]
severity: critical
date_documented: 2026-01-07
related_docs:
  - nextjs16-middleware-proxy-conflict.md
  - missing-modules-untracked-files.md
---

# App Route Migration - Cherry-Pick Import Path Conflicts

## Problem Summary

After cherry-picking commits to migrate routes from `/home/*` to `/app/*`, Railway builds failed with multiple "Module not found" errors. The root cause was a misunderstanding of TypeScript path alias behavior combined with duplicate configuration left over from merge conflicts.

## Symptoms

- Railway build fails with 5+ "Module not found" errors
- Local builds may succeed while CI/CD fails
- Error messages show paths like `./app/app/app/...` (triple `/app/`)
- 500 errors on `/app/*` routes even when build succeeds
- Table of Contents not staying sticky on report pages

Example error:
```
Module not found: Can't resolve '~/app/app/reports/_lib/types/hybrid-report-display.types'
```

## Root Cause

### 1. TypeScript Path Alias Misunderstanding

The tsconfig.json defines path aliases:

```json
{
  "paths": {
    "~/*": ["./app/*"]
  }
}
```

**Key insight**: `~/` already maps to `./app/`. So:
- `~/app/reports/` → `./app/app/reports/` (CORRECT)
- `~/app/app/reports/` → `./app/app/app/reports/` (WRONG - triple app!)

When migrating from `/home/*` to `/app/*`, developers incorrectly updated imports to use `~/app/app/` thinking the extra `/app/` was needed.

### 2. Duplicate Configuration from Cherry-Pick

Cherry-picking migration commits without proper conflict resolution left:
- Two `getRewrites()` functions in `next.config.mjs`
- Two `/app/*` route handlers in `proxy.ts`
- The first `getRewrites()` tried to rewrite `/app/*` to non-existent `/home/*` routes

### 3. CSS Layout Conflict

The TOC aside element had `self-start` class which prevented proper sticky positioning by shrinking the aside to content height.

## Solution

### Fix 1: Remove Duplicate `getRewrites()` in next.config.mjs

**Before:**
```javascript
// First function - tried to rewrite to old routes
async function getRewrites() {
  return [
    { source: '/app', destination: '/home' },
    { source: '/app/reports', destination: '/home' },
    // ...more rewrites to non-existent routes
  ];
}

// Second function - correct but ignored due to duplicate
async function getRewrites() {
  return [];
}
```

**After:**
```javascript
async function getRewrites() {
  // Routes are directly at /app/* - no rewrites needed
  return [];
}
```

**File:** `apps/web/next.config.mjs`

### Fix 2: Revert Import Paths from `~/app/app/` to `~/app/`

Use sed to bulk fix across all affected files:

```bash
# Find and preview changes
grep -r "~/app/app/" apps/web --include="*.ts" --include="*.tsx"

# Apply fix
find apps/web -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' "s|from '~/app/app/|from '~/app/|g" {} \;
```

**Before:**
```typescript
import { DURATION, EASING } from '~/app/app/_lib/animation-constants';
import type { HybridReportData } from '~/app/app/reports/_lib/types/hybrid-report-display.types';
```

**After:**
```typescript
import { DURATION, EASING } from '~/app/_lib/animation-constants';
import type { HybridReportData } from '~/app/reports/_lib/types/hybrid-report-display.types';
```

**Files affected:** 24+ files across `app/(marketing)`, `app/api`, `app/app/reports`, `app/share`

### Fix 3: Remove Duplicate `/app/*` Route Handler in proxy.ts

The cherry-pick left two handlers for `/app/*`:

**Before:**
```typescript
return [
  { pattern: new URLPattern({ pathname: '/admin/*?' }), handler: adminMiddleware },
  { pattern: new URLPattern({ pathname: '/auth/*?' }), handler: authHandler },
  { pattern: new URLPattern({ pathname: '/app/*?' }), handler: protectedRouteHandler },
  // DUPLICATE - left from cherry-pick
  {
    pattern: new URLPattern({ pathname: '/app/*?' }),
    handler: async (req, res) => {
      // Old implementation using checkRequiresMultiFactorAuthentication
    },
  },
];
```

**After:**
```typescript
return [
  { pattern: new URLPattern({ pathname: '/admin/*?' }), handler: adminMiddleware },
  { pattern: new URLPattern({ pathname: '/auth/*?' }), handler: authHandler },
  { pattern: new URLPattern({ pathname: '/app/*?' }), handler: protectedRouteHandler },
];
```

Also remove the unused import:
```typescript
// REMOVE
import { checkRequiresMultiFactorAuthentication } from '@kit/supabase/check-requires-mfa';
```

**File:** `apps/web/proxy.ts`

### Fix 4: Fix Sticky TOC by Removing `self-start`

**Before:**
```tsx
<aside className="relative z-30 hidden w-56 shrink-0 self-start lg:block">
```

**After:**
```tsx
<aside className="relative z-30 hidden w-56 shrink-0 lg:block">
```

**Why:** `self-start` aligns the aside to the top of its flex container, making it only as tall as its content. This breaks sticky positioning because the element has no room to scroll within its container.

**File:** `apps/web/app/app/reports/[id]/_components/brand-system/brand-system-report.tsx`

## Verification Checklist

After applying fixes:
- [ ] `pnpm typecheck` passes
- [ ] Railway build succeeds
- [ ] `/app` route loads without 500 error
- [ ] `/app/reports` and subpaths work
- [ ] TOC stays sticky when scrolling through reports
- [ ] Middleware redirects unauthenticated users correctly
- [ ] MFA verification still works

## Prevention

### 1. Understand tsconfig path aliases before migrations

Document the alias mapping prominently:
```
~/*        → ./app/*
~/config/* → ./config/*
~/lib/*    → ./lib/*
```

### 2. Use careful find-replace patterns

```bash
# WRONG - adds extra /app/
sed 's|~/home/|~/app/app/|g'

# CORRECT - understands alias already includes /app/
sed 's|~/home/|~/app/|g'
```

### 3. Resolve cherry-pick conflicts completely

After cherry-picking, search for duplicates:
```bash
# Check for duplicate function definitions
grep -c "async function getRewrites" apps/web/next.config.mjs

# Check for duplicate route patterns
grep "pathname: '/app/*" apps/web/proxy.ts
```

### 4. Test routing after config changes

Run a quick smoke test of all major routes before pushing.

## Related Commits

- `c1f79a34` - Remove duplicate getRewrites and fix /app/* routing
- `b6a8db35` - Remove duplicate /app/* route handler in proxy.ts
- `de315718` - Revert import paths - ~/app/ already maps to ./app/app/
- `02851318` - Make TOC sticky by removing self-start from aside

## Related Documentation

- [Next.js 16 Middleware/Proxy Conflict](./nextjs16-middleware-proxy-conflict.md)
- [Missing Modules from Untracked Files](./missing-modules-untracked-files.md)
