---
module: Authentication
date: 2025-01-05
problem_type: runtime_error
component: authentication
symptoms:
  - "Infinite page refresh loop on app.sparlo.ai subdomain"
  - "Browser continuously reloading without settling on any route"
  - "All protected routes unusable: /, /reports, /new, /settings, /billing, /teams, /support"
  - "Console showing repeated SIGNED_OUT events from Supabase auth listener"
root_cause: logic_error
resolution_type: code_fix
severity: critical
tags: [auth, supabase, subdomain, refresh-loop, race-condition, state-machine]
---

# Troubleshooting: Infinite Refresh Loop on App Subdomain

## Problem
The app subdomain (app.sparlo.ai) was stuck in an infinite refresh loop when users visited any route. The page would continuously reload, making the entire app unusable. This was caused by the Supabase auth change listener incorrectly handling subdomain-specific auth state.

## Environment
- Module: Authentication (packages/supabase/src/hooks/use-auth-change-listener.ts)
- Framework: Next.js 16 with React 19
- Affected Component: Supabase auth state listener hook
- Date: 2025-01-05

## Symptoms
- Infinite page refresh loop on app.sparlo.ai subdomain
- Browser continuously reloading without settling on any route
- All protected routes unusable: /, /reports, /new, /settings, /billing, /teams, /support
- Console showing repeated SIGNED_OUT events from Supabase auth listener
- Multiple page loads detected (10+ instead of expected 1-3)

## What Didn't Work

**Attempted Solution 1:** Initial fix using `hadSessionRef` to track if user ever had a session
- **Why it failed:** The ref was being set on ANY user event including transient `INITIAL_SESSION` events. This wasn't selective enough - token refresh could still trigger false SIGNED_OUT detection.

**Attempted Solution 2:** Checking `isOnPrivateRoute` before acting
- **Why it failed:** On the app subdomain, paths like `/settings` weren't being detected as private routes because the detection logic only checked main domain path prefixes (`/home`, `/admin`, etc.). The subdomain treats ALL paths as private.

## Solution

Complete rewrite of `use-auth-change-listener.ts` with four priority levels of fixes:

### P0: Security Fixes
Added domain allowlists to prevent open redirect and host header injection attacks:

```typescript
// Before (vulnerable):
function isAppSubdomain(): boolean {
  return window.location.hostname.startsWith('app.');
}

// After (secure):
const ALLOWED_APP_HOSTS = new Set([
  'app.sparlo.ai',
  'localhost',
  '127.0.0.1',
]);

function isAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const hostname = window.location.hostname;
    return ALLOWED_APP_HOSTS.has(hostname); // Exact match only
  } catch (error) {
    console.error('[AuthListener] Failed to check subdomain:', error);
    return false;
  }
}
```

### P1: Race Condition Fixes
Implemented state machine pattern to prevent double redirects and added debounce for SIGNED_OUT:

```typescript
// State machine action types
type AuthAction =
  | { type: 'REDIRECT_TO_MAIN_AUTH' }
  | { type: 'REDIRECT_TO_ROOT' }
  | { type: 'RELOAD' }
  | { type: 'IGNORE' }
  | { type: 'DEBOUNCE_SIGNED_OUT' };

// Prevent double redirects with ref
const isRedirectingRef = useRef(false);

// Only track STABLE sessions (not INITIAL_SESSION)
if (user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
  hadStableSessionRef.current = true;
}

// Debounce SIGNED_OUT to allow token refresh to complete
const SIGNED_OUT_DEBOUNCE_MS = 1500;
```

### P2: Architecture Fixes
Extracted reusable helpers with single source of truth configuration:

```typescript
// Single source of truth for configuration
const PRIVATE_PATH_PREFIXES = ['/home', '/admin', '/join', '/identities', '/update-password'];
const AUTH_PATHS = ['/auth'];
const PUBLIC_PATHS_ON_SUBDOMAIN = ['/auth', '/healthcheck'];

// Centralized decision function
function determineAuthAction(params: {
  event: AuthChangeEvent;
  user: Session | null;
  pathname: string;
  hadStableSession: boolean;
  privatePathPrefixes: string[];
}): AuthAction {
  // Single decision point - no scattered if/else logic
}
```

### P3: Simplification
Consolidated PUBLIC_PATHS_ON_SUBDOMAIN to essential paths only and added comprehensive debug logging:

```typescript
// Before (too many paths, confusing):
const PUBLIC_PATHS_ON_SUBDOMAIN = ['/auth', '/api', '/_next', '/locales', '/images', '/assets', '/healthcheck'];

// After (minimal, clear):
const PUBLIC_PATHS_ON_SUBDOMAIN = ['/auth', '/healthcheck'];

// Debug logging for troubleshooting
const DEBUG = true;
function debugLog(context: string, data: Record<string, unknown>) {
  if (DEBUG) {
    console.log(`[AuthListener:${context}]`, { timestamp: new Date().toISOString(), ...data });
  }
}
```

## Why This Works

1. **Root Cause**: The auth listener was triggering multiple redirects/reloads because:
   - It didn't properly distinguish between app subdomain and main domain
   - It reacted to transient `INITIAL_SESSION` events as if they were stable sessions
   - Multiple SIGNED_OUT events from token refresh were each triggering redirects
   - No guard against double redirects while one was in progress

2. **The Solution Addresses This By**:
   - Using exact hostname matching to reliably detect app subdomain
   - Only tracking "stable" sessions (SIGNED_IN, TOKEN_REFRESHED) - not INITIAL_SESSION
   - Debouncing SIGNED_OUT events by 1500ms to let token refresh complete
   - Using `isRedirectingRef` to prevent any action while a redirect is in progress
   - Centralizing all decision logic in `determineAuthAction()` state machine

3. **Underlying Issue**: The original code was designed for single-domain auth but was being used on a multi-subdomain setup where the app subdomain (app.sparlo.ai) needs different private route detection logic than the main domain (sparlo.ai).

## Prevention

- **For subdomain apps**: Always use exact hostname matching (allowlist) instead of prefix matching for security
- **For auth state listeners**: Use state machine pattern - single decision point that returns ONE action
- **For token refresh**: Always debounce SIGNED_OUT events to allow background token refresh to complete
- **For session tracking**: Only track "stable" session events (SIGNED_IN, TOKEN_REFRESHED), not transient ones
- **Add E2E tests**: Create Playwright tests that count page loads to detect refresh loops early

```typescript
// Example Playwright test pattern
let loadCount = 0;
page.on('load', () => { loadCount++; });
await page.goto('/protected-route');
await page.waitForTimeout(3000);
expect(loadCount).toBeLessThanOrEqual(3); // Loop would be 10+
```

## Related Issues

No related issues documented yet.

## Test Coverage

Playwright tests added at `apps/e2e/tests/authentication/refresh-loop.spec.ts`:
- Tests all protected routes: `/`, `/reports`, `/new`, `/settings`, `/billing`, `/teams`, `/support`
- Verifies redirect to sign-in without looping
- Counts page loads (should be ≤3, loop would be 10+)
- All 12 tests passing
