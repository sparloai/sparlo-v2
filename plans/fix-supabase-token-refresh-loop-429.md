# Fix: Supabase Token Refresh Loop (429 Rate Limit)

## Overview

**Critical Bug**: The app is making 863+ token refresh requests to Supabase, hitting rate limits and triggering "Possible abuse attempt" alerts. This completely blocks authentication.

**Root Cause**: The `use-auth-change-listener.ts` hook has a logic flaw where it doesn't properly recognize that ALL paths on `app.sparlo.ai` subdomain are private routes.

## Problem Analysis

### The Infinite Loop Sequence

```
1. User visits app.sparlo.ai/settings
2. Middleware rewrites /settings → /home/settings (server-side)
3. Browser URL remains /settings (rewrite is invisible to client)
4. Supabase client initializes, fires INITIAL_SESSION
5. Something triggers SIGNED_OUT (cookie parsing, token refresh race)
6. Auth listener checks: is /settings private?
   → isPrivateRoute('/settings') returns FALSE ← BUG
   → /settings doesn't start with /home, /admin, etc.
7. Falls through to: if (SIGNED_OUT && hadStableSession)
8. On subdomain → triggers DEBOUNCE_SIGNED_OUT
9. After 1500ms → redirects to main domain auth
10. User signs in → redirects back to app.sparlo.ai/settings
11. REPEAT from step 4 → INFINITE LOOP

Each iteration: ~20 token refresh attempts × 43 iterations = 860 requests
```

### Code Location

**File**: `packages/supabase/src/hooks/use-auth-change-listener.ts`

**Problem Lines**:
- Line 48: `PUBLIC_PATHS_ON_SUBDOMAIN = ['/auth', '/healthcheck']` - incomplete list
- Lines 112-132: `isPrivateRoute()` - doesn't properly detect subdomain

### Why SIGNED_OUT Keeps Firing

- Cross-subdomain cookie parsing issues
- Token refresh race conditions between middleware and browser client
- Multiple tabs causing session conflicts
- Stale refresh tokens from previous sessions

## Solution

### Fix 1: Complete PUBLIC_PATHS_ON_SUBDOMAIN List

```typescript
// Line 48 - Add all public paths
const PUBLIC_PATHS_ON_SUBDOMAIN = [
  '/auth',
  '/api',
  '/_next',
  '/locales',
  '/images',
  '/assets',
  '/healthcheck',
];
```

### Fix 2: Fix isPrivateRoute to Properly Handle Subdomain

The current logic already has subdomain detection but uses it incorrectly:

```typescript
// Current (BROKEN) - Line 112-132
function isPrivateRoute(path: string, privatePathPrefixes: string[]): boolean {
  const onAppSubdomain = isAppSubdomain();

  if (onAppSubdomain) {
    // This is correct but PUBLIC_PATHS_ON_SUBDOMAIN is incomplete
    const isPrivate = !isPublicPathOnSubdomain(path);
    return isPrivate;
  }

  // On main domain, use the prefix list
  return privatePathPrefixes.some((prefix) => path.startsWith(prefix));
}
```

The logic is correct, but `PUBLIC_PATHS_ON_SUBDOMAIN` is missing paths. Fix 1 resolves this.

### Fix 3: Disable Debug Logging in Production

```typescript
// Line 60 - Change to false
const DEBUG = false; // Was: true
```

### Fix 4: Add Rate Limit Protection

Add a circuit breaker to prevent repeated redirects:

```typescript
// Add after line 278 (isRedirectingRef)
const redirectCountRef = useRef(0);
const lastRedirectTimeRef = useRef(0);

// In the auth listener, before redirecting:
const now = Date.now();
if (now - lastRedirectTimeRef.current < 5000) {
  redirectCountRef.current++;
  if (redirectCountRef.current > 3) {
    console.error('[AuthListener] Too many redirects, stopping to prevent loop');
    return; // Stop the loop
  }
} else {
  redirectCountRef.current = 0;
}
lastRedirectTimeRef.current = now;
```

## Implementation

### File: `packages/supabase/src/hooks/use-auth-change-listener.ts`

```typescript
'use client';

import { useEffect, useEffectEvent, useRef } from 'react';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { useSupabase } from './use-supabase';

// ============================================================================
// CONFIGURATION - Single source of truth
// ============================================================================

/**
 * Allowed hostnames for the app subdomain.
 * Uses exact match to prevent host header injection attacks.
 */
const ALLOWED_APP_HOSTS = new Set(['app.sparlo.ai', 'localhost', '127.0.0.1']);

/**
 * Allowed production domains for redirects.
 * Prevents open redirect vulnerabilities.
 */
const ALLOWED_REDIRECT_DOMAINS = new Set([
  'sparlo.ai',
  'localhost',
  '127.0.0.1',
]);

/**
 * Private path prefixes for the main domain.
 */
const PRIVATE_PATH_PREFIXES = [
  '/home',
  '/admin',
  '/join',
  '/identities',
  '/update-password',
];

/**
 * Auth paths - never redirect/reload on these.
 */
const AUTH_PATHS = ['/auth'];

/**
 * Public paths on app subdomain (don't require auth).
 * MUST match the excluded paths in proxy.ts/next.config.mjs
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
 * Grace period (ms) before acting on SIGNED_OUT.
 * Allows token refresh to complete.
 */
const SIGNED_OUT_DEBOUNCE_MS = 1500;

/**
 * Maximum redirects allowed within REDIRECT_WINDOW_MS to prevent loops.
 */
const MAX_REDIRECTS_IN_WINDOW = 3;
const REDIRECT_WINDOW_MS = 10000;

// ============================================================================
// DEBUG LOGGING
// ============================================================================

const DEBUG = false; // Disabled in production

function debugLog(context: string, data: Record<string, unknown>) {
  if (DEBUG) {
    console.log(`[AuthListener:${context}]`, {
      timestamp: new Date().toISOString(),
      ...data,
    });
  }
}

// ============================================================================
// SUBDOMAIN DETECTION
// ============================================================================

/**
 * Check if we're on the app subdomain using exact hostname match.
 * Prevents host header injection attacks (e.g., app.sparlo.ai.attacker.com).
 */
function isAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const hostname = window.location.hostname;
    const isApp = ALLOWED_APP_HOSTS.has(hostname);

    debugLog('isAppSubdomain', {
      hostname,
      isApp,
      allowedHosts: [...ALLOWED_APP_HOSTS],
    });

    return isApp;
  } catch (error) {
    console.error('[AuthListener] Failed to check subdomain:', error);
    return false;
  }
}

/**
 * Check if a path is public on the app subdomain.
 */
function isPublicPathOnSubdomain(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname;
  return PUBLIC_PATHS_ON_SUBDOMAIN.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/**
 * Determines if a path requires authentication.
 */
function isPrivateRoute(path: string, privatePathPrefixes: string[]): boolean {
  const onAppSubdomain = isAppSubdomain();

  if (onAppSubdomain) {
    // On app subdomain, all paths except public paths are private
    const isPrivate = !isPublicPathOnSubdomain(path);
    debugLog('isPrivateRoute:subdomain', { path, isPrivate });
    return isPrivate;
  }

  // On main domain, use the prefix list
  const isPrivate = privatePathPrefixes.some((prefix) =>
    path.startsWith(prefix),
  );
  debugLog('isPrivateRoute:mainDomain', {
    path,
    isPrivate,
    prefixes: privatePathPrefixes,
  });
  return isPrivate;
}

// ============================================================================
// REDIRECT UTILITIES
// ============================================================================

/**
 * Get safe redirect URL for main domain auth.
 * Validates domain against allowlist to prevent open redirects.
 */
function getMainDomainAuthUrl(): string {
  const domain = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN ?? 'sparlo.ai';

  // Security: Validate domain against allowlist
  if (!ALLOWED_REDIRECT_DOMAINS.has(domain)) {
    console.error(
      `[AuthListener:SECURITY] Invalid domain: ${domain}, using fallback`,
    );
    return 'https://sparlo.ai/auth/sign-in';
  }

  // Use current protocol for localhost development
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${domain}/auth/sign-in`;
}

/**
 * Redirect to main domain auth page.
 */
function redirectToMainDomainAuth(): void {
  const url = getMainDomainAuthUrl();
  debugLog('redirectToMainDomainAuth', { url });
  window.location.assign(url);
}

// ============================================================================
// AUTH ACTION TYPES (State Machine Pattern)
// ============================================================================

type AuthAction =
  | { type: 'REDIRECT_TO_MAIN_AUTH' }
  | { type: 'REDIRECT_TO_ROOT' }
  | { type: 'RELOAD' }
  | { type: 'IGNORE' }
  | { type: 'DEBOUNCE_SIGNED_OUT' };

/**
 * Determine the appropriate action based on auth event and state.
 * Single decision point prevents double redirects.
 */
function determineAuthAction(params: {
  event: AuthChangeEvent;
  user: Session | null;
  pathname: string;
  hadStableSession: boolean;
  privatePathPrefixes: string[];
}): AuthAction {
  const { event, user, pathname, hadStableSession, privatePathPrefixes } =
    params;
  const onAppSubdomain = isAppSubdomain();
  const isOnAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  debugLog('determineAuthAction:input', {
    event,
    hasUser: !!user,
    pathname,
    hadStableSession,
    onAppSubdomain,
    isOnAuthPath,
  });

  // CRITICAL: Never redirect on INITIAL_SESSION - the session may still be loading
  // from cookies. Wait for a definitive SIGNED_IN or SIGNED_OUT event.
  if (event === 'INITIAL_SESSION') {
    debugLog('determineAuthAction:initialSession', { action: 'IGNORE' });
    return { type: 'IGNORE' };
  }

  // Priority 1: No user on private route - redirect to auth
  // Only act on SIGNED_OUT events, not transient states
  if (!user && event === 'SIGNED_OUT' && isPrivateRoute(pathname, privatePathPrefixes)) {
    const action: AuthAction = onAppSubdomain
      ? { type: 'REDIRECT_TO_MAIN_AUTH' }
      : { type: 'REDIRECT_TO_ROOT' };

    debugLog('determineAuthAction:noUserOnPrivate', { action });
    return action;
  }

  // Priority 2: SIGNED_OUT after having stable session
  if (event === 'SIGNED_OUT' && hadStableSession) {
    // Never redirect/reload on auth paths
    if (isOnAuthPath) {
      debugLog('determineAuthAction:signedOutOnAuthPath', { action: 'IGNORE' });
      return { type: 'IGNORE' };
    }

    // On app subdomain, debounce then redirect to main domain
    // This prevents loops from transient auth issues
    if (onAppSubdomain) {
      debugLog('determineAuthAction:signedOutOnSubdomain', {
        action: 'DEBOUNCE_SIGNED_OUT',
      });
      return { type: 'DEBOUNCE_SIGNED_OUT' };
    }

    // On main domain, reload to refresh state
    debugLog('determineAuthAction:signedOutOnMainDomain', { action: 'RELOAD' });
    return { type: 'RELOAD' };
  }

  debugLog('determineAuthAction:default', { action: 'IGNORE' });
  return { type: 'IGNORE' };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * @name useAuthChangeListener
 * @description Listens for Supabase auth state changes and handles redirects.
 *
 * Features:
 * - Subdomain-aware: Treats all paths on app.sparlo.ai as private
 * - Security: Domain allowlist prevents open redirects
 * - Race-safe: State machine pattern prevents double redirects
 * - Debounced: Grace period for SIGNED_OUT allows token refresh to complete
 * - Loop protection: Circuit breaker prevents infinite redirect loops
 */
export function useAuthChangeListener({
  privatePathPrefixes = PRIVATE_PATH_PREFIXES,
  onEvent,
}: {
  privatePathPrefixes?: string[];
  onEvent?: (event: AuthChangeEvent, user: Session | null) => void;
}) {
  const client = useSupabase();

  // Track if user ever had a stable session (SIGNED_IN or TOKEN_REFRESHED)
  // This prevents false positives from transient INITIAL_SESSION events
  const hadStableSessionRef = useRef(false);

  // Track pending debounced actions for cleanup
  const pendingTimeoutRef = useRef<number | null>(null);

  // Prevent multiple redirects
  const isRedirectingRef = useRef(false);

  // Circuit breaker: Track redirects to prevent infinite loops
  const redirectCountRef = useRef(0);
  const lastRedirectTimeRef = useRef(0);

  const setupAuthListener = useEffectEvent(() => {
    if (typeof window === 'undefined') {
      return;
    }

    debugLog('setup', {
      pathname: window.location.pathname,
      hostname: window.location.hostname,
    });

    return client.auth.onAuthStateChange((event, session) => {
      // Capture state at event time
      const pathname = window.location.pathname;
      const user = session;

      debugLog('authStateChange', {
        event,
        hasUser: !!user,
        pathname,
        hadStableSession: hadStableSessionRef.current,
        isRedirecting: isRedirectingRef.current,
      });

      // Fire callback
      if (onEvent) {
        onEvent(event, user);
      }

      // Track stable sessions (not INITIAL_SESSION which can be transient)
      if (user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        debugLog('stableSessionDetected', { event });
        hadStableSessionRef.current = true;
      }

      // Cancel any pending debounced redirect if we get a new session
      if (user && pendingTimeoutRef.current !== null) {
        debugLog('cancelPendingRedirect', { reason: 'userSessionRestored' });
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      // Prevent duplicate redirects
      if (isRedirectingRef.current) {
        debugLog('skipAction', { reason: 'alreadyRedirecting' });
        return;
      }

      // Determine action using state machine
      const action = determineAuthAction({
        event,
        user,
        pathname,
        hadStableSession: hadStableSessionRef.current,
        privatePathPrefixes,
      });

      // Circuit breaker: Check for redirect loops
      const checkAndIncrementRedirectCount = (): boolean => {
        const now = Date.now();
        if (now - lastRedirectTimeRef.current < REDIRECT_WINDOW_MS) {
          redirectCountRef.current++;
          if (redirectCountRef.current > MAX_REDIRECTS_IN_WINDOW) {
            console.error(
              '[AuthListener] Circuit breaker: Too many redirects in short window, stopping to prevent loop',
              {
                redirectCount: redirectCountRef.current,
                windowMs: REDIRECT_WINDOW_MS,
              }
            );
            return false; // Stop - too many redirects
          }
        } else {
          redirectCountRef.current = 1; // Reset count for new window
        }
        lastRedirectTimeRef.current = now;
        return true; // OK to redirect
      };

      // Execute action
      switch (action.type) {
        case 'REDIRECT_TO_MAIN_AUTH':
          if (!checkAndIncrementRedirectCount()) return;
          isRedirectingRef.current = true;
          redirectToMainDomainAuth();
          break;

        case 'REDIRECT_TO_ROOT':
          if (!checkAndIncrementRedirectCount()) return;
          isRedirectingRef.current = true;
          debugLog('redirectToRoot', {});
          window.location.assign('/');
          break;

        case 'RELOAD':
          if (!checkAndIncrementRedirectCount()) return;
          isRedirectingRef.current = true;
          debugLog('reload', {});
          window.location.reload();
          break;

        case 'DEBOUNCE_SIGNED_OUT':
          // Wait before redirecting - token refresh might be in progress
          debugLog('debounceSignedOut', { delayMs: SIGNED_OUT_DEBOUNCE_MS });

          if (pendingTimeoutRef.current !== null) {
            clearTimeout(pendingTimeoutRef.current);
          }

          pendingTimeoutRef.current = window.setTimeout(() => {
            pendingTimeoutRef.current = null;

            // Re-check if we should still redirect
            // (user might have been restored during debounce)
            if (!isRedirectingRef.current) {
              if (!checkAndIncrementRedirectCount()) return;
              debugLog('debounceComplete', { action: 'redirectToMainAuth' });
              isRedirectingRef.current = true;
              redirectToMainDomainAuth();
            }
          }, SIGNED_OUT_DEBOUNCE_MS);
          break;

        case 'IGNORE':
          // Do nothing
          break;
      }
    });
  });

  useEffect(() => {
    const listener = setupAuthListener();

    return () => {
      // Clean up pending timeouts
      if (pendingTimeoutRef.current !== null) {
        clearTimeout(pendingTimeoutRef.current);
        pendingTimeoutRef.current = null;
      }

      // Unsubscribe from auth changes
      listener?.data.subscription.unsubscribe();
    };
  }, []);
}
```

## Acceptance Criteria

- [ ] No more 429 rate limit errors in Supabase logs
- [ ] No "Possible abuse attempt" alerts
- [ ] Users can sign in successfully on both main domain and app subdomain
- [ ] Signing out redirects to main domain auth without loops
- [ ] Circuit breaker prevents any future infinite loops
- [ ] Debug logging is disabled in production

## Testing Plan

### Manual Testing

1. Clear all browser storage for sparlo.ai
2. Wait 30 minutes for rate limits to fully reset
3. Test sign-in flow:
   - Visit app.sparlo.ai/settings (unauthenticated) → should redirect to sign-in
   - Sign in → should redirect back to app.sparlo.ai/settings
   - No refresh loops should occur
4. Test sign-out flow:
   - Click sign out on app subdomain
   - Should redirect to main domain auth without loops
5. Monitor Supabase logs for any 429 errors

### Verification Commands

```bash
# Watch Supabase auth logs for rate limits
# In Supabase Dashboard > Logs > Auth

# Check for token refresh requests in browser
# DevTools > Network > Filter: token
```

## Risk Assessment

- **Low**: Changes are isolated to auth listener hook
- **Medium**: Circuit breaker might block legitimate redirects if threshold too low
- **Mitigation**: Set MAX_REDIRECTS_IN_WINDOW = 3, REDIRECT_WINDOW_MS = 10000 (generous limits)

## References

- `packages/supabase/src/hooks/use-auth-change-listener.ts` - Auth listener hook
- `apps/web/proxy.ts` - Middleware with subdomain routing
- `apps/web/next.config.mjs` - Rewrite rules for subdomain
- `plans/fix-app-subdomain-refresh-loop.md` - Previous related fix plan
