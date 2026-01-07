# Fix: App Subdomain Refresh Loop

## Overview

The `app.sparlo.ai` subdomain is stuck in an infinite refresh loop. This affects all routes:
- `app.sparlo.ai/reports`
- `app.sparlo.ai/new`
- `app.sparlo.ai/settings`
- `app.sparlo.ai/billing`
- `app.sparlo.ai/teams`
- `app.sparlo.ai/support`
- `app.sparlo.ai/reports/[report-id]`

## Problem Statement

### Root Cause Analysis

There's a **mismatch between how the middleware and the auth listener determine protected routes** on the app subdomain:

**Middleware (proxy.ts):**
- On `app.sparlo.ai/*`, ALL paths (except /auth, /api, etc.) are treated as protected
- Requests are rewritten from `/` → `/home/`, `/settings` → `/home/settings`, etc.
- The middleware protects routes based on the **host** being `app.sparlo.ai`

**Auth Listener (use-auth-change-listener.ts):**
- Uses `window.location.pathname` to check if route is private
- On `app.sparlo.ai/settings`, the browser URL pathname is `/settings`, NOT `/home/settings`
- `isPrivateRoute('/settings')` returns `false` because it doesn't start with `/home`
- Therefore, the auth listener thinks it's a **public route**

### The Refresh Loop Scenario

1. User visits `app.sparlo.ai/settings` (unauthenticated)
2. Middleware detects no auth, redirects to `sparlo.ai/auth/sign-in?next=/home/settings`
3. User signs in, redirected back to `app.sparlo.ai/settings`
4. Page loads, Supabase client initializes
5. `INITIAL_SESSION` fires → `hadSessionRef.current = true`
6. Something triggers `SIGNED_OUT` (cookie parsing issue, token refresh race, etc.)
7. Auth listener checks: is `/settings` a private route? **NO** (doesn't start with `/home`)
8. Falls through to: `if (event === 'SIGNED_OUT' && hadSessionRef.current)` → **TRUE**
9. Is `/settings` an auth path? **NO**
10. `window.location.reload()` is called
11. Repeat from step 3 → **INFINITE LOOP**

### Why `SIGNED_OUT` Keeps Firing

Supabase can fire `SIGNED_OUT` for several reasons:
- Session cookie not readable on subdomain (domain mismatch)
- Token refresh failure
- Multiple tabs causing session conflicts
- Initial session load detecting no valid session

## Technical Deep Dive

### File: `packages/supabase/src/hooks/use-auth-change-listener.ts`

```typescript:packages/supabase/src/hooks/use-auth-change-listener.ts
const PRIVATE_PATH_PREFIXES = [
  '/home',    // ← Doesn't include '/' or '/settings' etc.
  '/admin',
  '/join',
  '/identities',
  '/update-password',
];

// On app.sparlo.ai/settings:
const pathName = window.location.pathname; // '/settings'
const shouldRedirectUser = !user && isPrivateRoute('/settings', PRIVATE_PATH_PREFIXES);
// isPrivateRoute('/settings') → false (doesn't start with /home, /admin, etc.)
// shouldRedirectUser → false

// Falls through to:
if (event === 'SIGNED_OUT' && hadSessionRef.current) {
  // hadSessionRef.current is true if user was ever signed in
  if (!AUTH_PATHS.some(path => pathName.startsWith(path))) {
    window.location.reload(); // ← THIS IS THE LOOP
  }
}
```

### File: `apps/web/proxy.ts`

```typescript:apps/web/proxy.ts
// On app subdomain, ALL paths (except public) are protected
if (isAppSubdomain(request)) {
  basePatterns.push({
    pattern: new URLPattern({ pathname: '/*?' }),
    handler: async (req, res) => {
      const pathname = req.nextUrl.pathname;
      if (isPublicPath(pathname)) return;
      // Protect ALL other routes on app subdomain
      return protectedRouteHandler(req, res, { redirectPrefix: '/home' });
    },
  });
}
```

## Proposed Solution

### Option A: Make Auth Listener Subdomain-Aware (Recommended)

Add subdomain detection to the auth listener so it knows ALL paths on `app.sparlo.ai` are private:

```typescript:packages/supabase/src/hooks/use-auth-change-listener.ts
const APP_SUBDOMAIN_HOST = 'app.sparlo.ai';

function isAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === APP_SUBDOMAIN_HOST || hostname === 'localhost';
}

function isPrivateRoute(path: string, privatePathPrefixes: string[]): boolean {
  // On app subdomain, all paths except auth/public are private
  if (isAppSubdomain()) {
    const publicPaths = ['/auth', '/api', '/_next', '/locales', '/images', '/assets'];
    return !publicPaths.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
  }
  // On main domain, use the prefix list
  return privatePathPrefixes.some(prefix => path.startsWith(prefix));
}
```

**Pros:**
- Clean separation of concerns
- Auth listener understands its environment
- Consistent with how middleware works

**Cons:**
- Duplicates some logic from subdomain.config.ts

### Option B: Never Reload on App Subdomain (Simpler)

On the app subdomain, the middleware already handles auth. The auth listener should NOT reload:

```typescript:packages/supabase/src/hooks/use-auth-change-listener.ts
// On app subdomain, don't reload - let middleware handle auth
if (event === 'SIGNED_OUT' && hadSessionRef.current) {
  if (isAppSubdomain()) {
    // On app subdomain, redirect to main domain for auth
    window.location.assign('https://sparlo.ai/auth/sign-in');
    return;
  }

  if (AUTH_PATHS.some(path => pathName.startsWith(path))) {
    return;
  }

  window.location.reload();
}
```

**Pros:**
- Simple change
- Prevents all refresh loops on subdomain

**Cons:**
- Always redirects to sign-in, even for transient auth issues

### Option C: Use Token Validation Instead of Events (Most Robust)

Instead of reacting to `SIGNED_OUT` events, validate the actual session state:

```typescript:packages/supabase/src/hooks/use-auth-change-listener.ts
// Only act on SIGNED_OUT if we can confirm there's no valid session
if (event === 'SIGNED_OUT' && hadSessionRef.current) {
  // Double-check there's really no session
  const { data: { session } } = await client.auth.getSession();
  if (session) {
    // False alarm - still have a session
    return;
  }

  // ... proceed with redirect/reload logic
}
```

**Pros:**
- Most accurate
- Handles race conditions

**Cons:**
- Adds async complexity
- Need to handle the callback correctly (can't be async in onAuthStateChange)

## Implementation Plan

### Phase 1: Immediate Fix (Option A)

1. **Update `use-auth-change-listener.ts`** to be subdomain-aware
2. **Add hostname detection** that matches `subdomain.config.ts` logic
3. **Test locally** with production build pointed at app subdomain
4. **Deploy and verify** on app.sparlo.ai

### Phase 2: Improve Robustness

1. **Add logging** to track auth events in production
2. **Consider Option C** for handling race conditions
3. **Add E2E tests** for all subdomain routes

## Acceptance Criteria

- [ ] `app.sparlo.ai/` loads without refresh loop (unauthenticated → redirects to sign-in)
- [ ] `app.sparlo.ai/` loads without refresh loop (authenticated → shows dashboard)
- [ ] `app.sparlo.ai/reports` loads correctly
- [ ] `app.sparlo.ai/new` loads correctly
- [ ] `app.sparlo.ai/settings` loads correctly
- [ ] `app.sparlo.ai/billing` loads correctly
- [ ] `app.sparlo.ai/teams` loads correctly
- [ ] `app.sparlo.ai/support` loads correctly
- [ ] `app.sparlo.ai/reports/[id]` loads correctly
- [ ] Signing out on app subdomain redirects properly
- [ ] E2E tests pass

## Code Changes

### File: `packages/supabase/src/hooks/use-auth-change-listener.ts`

```typescript
'use client';

import { useEffect, useEffectEvent, useRef } from 'react';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { useSupabase } from './use-supabase';

/**
 * @name PRIVATE_PATH_PREFIXES
 * @description A list of private path prefixes for the main domain
 */
const PRIVATE_PATH_PREFIXES = [
  '/home',
  '/admin',
  '/join',
  '/identities',
  '/update-password',
];

/**
 * @name AUTH_PATHS
 * @description A list of auth paths (never reload on these)
 */
const AUTH_PATHS = ['/auth'];

/**
 * @name PUBLIC_PATHS_ON_SUBDOMAIN
 * @description Paths that are public on the app subdomain
 */
const PUBLIC_PATHS_ON_SUBDOMAIN = [
  '/auth',
  '/api',
  '/_next',
  '/locales',
  '/images',
  '/assets',
  '/healthcheck',
];

/**
 * Check if we're on the app subdomain.
 * Uses environment variable for domain, with fallback.
 */
function isAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN || 'app';
  const productionDomain = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'sparlo.ai';
  const appSubdomainHost = `${appSubdomain}.${productionDomain}`;

  return hostname === appSubdomainHost;
}

/**
 * Determines if a given path is a private route.
 * On the app subdomain, all paths except public paths are private.
 * On the main domain, uses the prefix list.
 */
function isPrivateRoute(path: string, privatePathPrefixes: string[]): boolean {
  // On app subdomain, all paths except public paths are private
  if (isAppSubdomain()) {
    return !PUBLIC_PATHS_ON_SUBDOMAIN.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`),
    );
  }

  // On main domain, use the prefix list
  return privatePathPrefixes.some((prefix) => path.startsWith(prefix));
}

/**
 * @name useAuthChangeListener
 * @param privatePathPrefixes - A list of private path prefixes
 * @param onEvent - Callback function to be called when an auth event occurs
 */
export function useAuthChangeListener({
  privatePathPrefixes = PRIVATE_PATH_PREFIXES,
  onEvent,
}: {
  privatePathPrefixes?: string[];
  onEvent?: (event: AuthChangeEvent, user: Session | null) => void;
}) {
  const client = useSupabase();
  // Track if user was ever signed in during this session
  // This prevents reload loops when SIGNED_OUT fires on initial load without a session
  const hadSessionRef = useRef(false);

  const setupAuthListener = useEffectEvent(() => {
    // don't run on the server
    if (typeof window === 'undefined') {
      return;
    }

    // keep this running for the whole session unless the component was unmounted
    return client.auth.onAuthStateChange((event, user) => {
      const pathName = window.location.pathname;

      if (onEvent) {
        onEvent(event, user);
      }

      // Track if we've ever had a session
      if (user) {
        hadSessionRef.current = true;
      }

      // log user out if user is falsy
      // and if the current path is a private route
      const shouldRedirectUser =
        !user && isPrivateRoute(pathName, privatePathPrefixes);

      if (shouldRedirectUser) {
        // On app subdomain, redirect to main domain for auth
        if (isAppSubdomain()) {
          const productionDomain = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'sparlo.ai';
          window.location.assign(`https://${productionDomain}/auth/sign-in`);
          return;
        }

        // On main domain, redirect to root
        window.location.assign('/');
        return;
      }

      // revalidate user session when user signs in or out
      // Only reload if user was previously signed in to prevent infinite loops
      if (event === 'SIGNED_OUT' && hadSessionRef.current) {
        // On app subdomain, redirect to main domain instead of reloading
        // This prevents refresh loops caused by session desync
        if (isAppSubdomain()) {
          const productionDomain = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'sparlo.ai';
          window.location.assign(`https://${productionDomain}/auth/sign-in`);
          return;
        }

        // sometimes Supabase sends SIGNED_OUT event
        // but in the auth path, so we ignore it
        if (AUTH_PATHS.some((path) => pathName.startsWith(path))) {
          return;
        }

        window.location.reload();
      }
    });
  });

  useEffect(() => {
    const listener = setupAuthListener();

    // destroy listener on un-mounts
    return () => {
      listener?.data.subscription.unsubscribe();
    };
  }, []);
}
```

## Testing Strategy

### Manual Testing

1. Clear all cookies for sparlo.ai and app.sparlo.ai
2. Visit each route unauthenticated:
   - `app.sparlo.ai/` → Should redirect to sign-in without loop
   - `app.sparlo.ai/settings` → Should redirect to sign-in without loop
   - `app.sparlo.ai/reports` → Should redirect to sign-in without loop
3. Sign in on main domain
4. Visit each route authenticated:
   - `app.sparlo.ai/` → Should load dashboard
   - `app.sparlo.ai/settings` → Should load settings
   - `app.sparlo.ai/reports` → Should load reports list
5. Sign out and verify redirect

### E2E Tests

Update `apps/e2e/tests/authentication/refresh-loop.spec.ts` to test subdomain-specific behavior:

```typescript
test.describe('App subdomain refresh loop prevention', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('app.sparlo.ai routes redirect to sign-in without refresh loop', async ({ page }) => {
    const routes = ['/settings', '/reports', '/billing', '/teams'];

    for (const route of routes) {
      let loadCount = 0;
      page.on('load', () => loadCount++);

      await page.goto(`https://app.sparlo.ai${route}`);
      await expect(page).toHaveURL(/\/auth\/sign-in/);
      await page.waitForTimeout(2000);
      expect(loadCount).toBeLessThanOrEqual(2);
    }
  });
});
```

## Dependencies & Risks

### Dependencies
- Environment variables: `NEXT_PUBLIC_APP_SUBDOMAIN`, `NEXT_PUBLIC_PRODUCTION_DOMAIN`
- Cookie domain configuration in middleware and browser clients

### Risks
- **Low**: Breaking existing main domain auth flow
- **Medium**: Cookie domain mismatch causing session issues
- **Low**: E2E tests may need updating for subdomain testing

## Success Metrics

- Zero refresh loops on any app.sparlo.ai route
- Sign-in/sign-out flow works correctly across domains
- No regression in main domain (sparlo.ai) auth flow

## References

- `apps/web/proxy.ts` - Middleware with subdomain routing
- `apps/web/config/subdomain.config.ts` - Subdomain configuration
- `packages/supabase/src/hooks/use-auth-change-listener.ts` - Auth state listener
- `packages/supabase/src/clients/browser-client.ts` - Browser Supabase client
- `packages/supabase/src/clients/middleware-client.ts` - Middleware Supabase client
- `apps/web/next.config.mjs` - Rewrite rules (lines 177-202)
