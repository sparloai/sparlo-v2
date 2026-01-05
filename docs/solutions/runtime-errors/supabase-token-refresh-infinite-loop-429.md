---
title: Supabase Token Refresh Infinite Loop (429 Rate Limit)
category: runtime-errors
severity: critical
date_solved: 2026-01-05
components:
  - authentication
  - supabase
  - subdomain-routing
symptoms:
  - 429 Too Many Requests on /auth/v1/token endpoint
  - "Possible abuse attempt" alerts in Supabase logs
  - Users cannot authenticate
  - Error persists in incognito mode
tags:
  - supabase
  - auth
  - rate-limit
  - infinite-loop
  - circuit-breaker
  - subdomain
related_files:
  - packages/supabase/src/hooks/use-auth-change-listener.ts
  - apps/web/config/subdomain.config.ts
  - apps/web/proxy.ts
---

# Supabase Token Refresh Infinite Loop (429 Rate Limit)

## Problem Summary

Users were completely blocked from authenticating. Supabase logs showed 863+ token refresh requests within 25 minutes, triggering rate limits (429 errors) and "Possible abuse attempt" alerts.

### Symptoms

- `POST /auth/v1/token?grant_type=refresh_token` returning 429
- Browser console showing repeated auth listener debug messages
- Frontend error: "Sorry, we could not authenticate you"
- Issue persisted even in incognito mode (proving it was code, not stale tokens)

## Root Cause

The `use-auth-change-listener.ts` hook had an incomplete `PUBLIC_PATHS_ON_SUBDOMAIN` array that was out of sync with the central config in `subdomain.config.ts`.

### The Infinite Loop Sequence

```
1. User visits app.sparlo.ai/settings
2. Middleware rewrites /settings → /home/settings (server-side, invisible to client)
3. Browser URL remains /settings
4. Supabase client initializes, fires INITIAL_SESSION
5. Something triggers SIGNED_OUT (cookie parsing race, token refresh)
6. Auth listener checks: is /settings private?
   → isPrivateRoute('/settings') checks PUBLIC_PATHS_ON_SUBDOMAIN
   → /settings not in list → marked as PRIVATE
   → But /share was MISSING from the list too!
7. Falls through to DEBOUNCE_SIGNED_OUT action
8. After 1500ms → redirects to main domain auth
9. User signs in → redirects back to app.sparlo.ai
10. REPEAT from step 4 → INFINITE LOOP

Each iteration: ~20 token refresh attempts × 43 iterations = 860+ requests
```

### Config Divergence

**Auth Listener (BROKEN):**
```typescript
const PUBLIC_PATHS_ON_SUBDOMAIN = [
  '/auth',
  '/api',
  '/_next',
  '/locales',
  '/images',
  '/assets',
  '/healthcheck',
  // MISSING: '/share' ← This caused the bug!
];
```

**Central Config (CORRECT):**
```typescript
export const PUBLIC_PATHS = [
  '/auth',
  '/healthcheck',
  '/api',
  '/share',      // ← Present here
  '/_next',
  '/locales',
  '/images',
  '/assets',
] as const;
```

## Solution

### 1. Sync PUBLIC_PATHS_ON_SUBDOMAIN with Central Config

```typescript
// packages/supabase/src/hooks/use-auth-change-listener.ts

/**
 * Public paths on app subdomain (don't require auth).
 * MUST match PUBLIC_PATHS in apps/web/config/subdomain.config.ts
 */
const PUBLIC_PATHS_ON_SUBDOMAIN = [
  '/auth',
  '/api',
  '/share',      // ← Added
  '/_next',
  '/locales',
  '/images',
  '/assets',
  '/healthcheck',
];
```

### 2. Add Circuit Breaker to Prevent Future Loops

```typescript
// Circuit breaker constants
const MAX_REDIRECTS_IN_WINDOW = 3;
const REDIRECT_WINDOW_MS = 10_000; // 10 seconds

// Circuit breaker function (extracted to module level)
function checkRedirectAllowed(
  redirectCountRef: React.MutableRefObject<number>,
  lastRedirectTimeRef: React.MutableRefObject<number>,
): boolean {
  const now = Date.now();
  const timeSinceLastRedirect = now - lastRedirectTimeRef.current;

  if (timeSinceLastRedirect < REDIRECT_WINDOW_MS) {
    redirectCountRef.current++;

    if (redirectCountRef.current > MAX_REDIRECTS_IN_WINDOW) {
      console.error('[AuthListener] Circuit breaker: redirect loop detected');
      return false; // Stop the loop
    }
  } else {
    redirectCountRef.current = 1; // Reset for new window
  }

  lastRedirectTimeRef.current = now;
  return true;
}

// Usage in each redirect case:
case 'REDIRECT_TO_MAIN_AUTH':
  if (!checkRedirectAllowed(redirectCountRef, lastRedirectTimeRef)) return;
  isRedirectingRef.current = true;
  redirectToMainDomainAuth();
  break;
```

### 3. Sanitize Error Logging (Security)

```typescript
// Before (exposed internal config):
console.error('[AuthListener] Circuit breaker triggered', {
  redirectCount: redirectCountRef.current,
  windowMs: REDIRECT_WINDOW_MS,  // Exposed timing config
});

// After (production-safe):
console.error('[AuthListener] Circuit breaker: redirect loop detected');
```

## Files Changed

| File | Change |
|------|--------|
| `packages/supabase/src/hooks/use-auth-change-listener.ts` | Added `/share`, circuit breaker, sanitized logging |
| `packages/features/auth/src/components/auth-error-alert.tsx` | Removed temporary debug code |

## Prevention Strategies

### 1. Single Source of Truth for Configs

The `PUBLIC_PATHS_ON_SUBDOMAIN` comment now explicitly references `subdomain.config.ts`:

```typescript
/**
 * Public paths on app subdomain (don't require auth).
 * MUST match PUBLIC_PATHS in apps/web/config/subdomain.config.ts
 */
```

**Future improvement:** Import directly from shared config or create a shared `packages/routing` package.

### 2. Circuit Breaker Pattern

The circuit breaker ensures that even if a config issue causes a loop, it will:
- Stop after 3 redirects within 10 seconds
- Log an error for debugging
- Prevent rate limit abuse

### 3. Monitoring Recommendations

- **Supabase Dashboard:** Monitor `/auth/v1/token` request rates
- **Alert on:** "Possible abuse attempt" messages
- **Browser Console:** Watch for `[AuthListener] Circuit breaker` messages

### 4. Testing Checklist

Before deploying auth changes:

- [ ] Verify `PUBLIC_PATHS_ON_SUBDOMAIN` matches `subdomain.config.ts`
- [ ] Test sign-in flow on both `sparlo.ai` and `app.sparlo.ai`
- [ ] Test sign-out flow from subdomain
- [ ] Test `/share/*` routes work without auth
- [ ] Monitor Supabase logs for 10 minutes post-deploy

## Related Documentation

- `plans/fix-supabase-token-refresh-loop-429.md` - Detailed fix plan
- `plans/fix-app-subdomain-refresh-loop.md` - Previous related fix
- `packages/supabase/CLAUDE.md` - Supabase package guidance
- `apps/web/config/subdomain.config.ts` - Central routing config

## Commit Reference

```
58f6fe4 fix(auth): prevent Supabase token refresh infinite loop (429 rate limit)
```

## Key Learnings

1. **Config sync is critical:** Multiple files defining the same constants will diverge
2. **Circuit breakers save the day:** Even with bugs, rate limiting prevents catastrophic failure
3. **Debug in incognito:** If issue persists in incognito, it's code, not browser state
4. **Supabase logs are detailed:** "Possible abuse attempt: 863" told us exactly how bad it was
5. **Middleware rewrites are invisible:** Browser URL doesn't reflect server-side rewrites
