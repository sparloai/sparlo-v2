'use client';

import type React from 'react';
import { useEffect, useEffectEvent, useRef } from 'react';

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { useSupabase } from './use-supabase';

// ============================================================================
// CONFIGURATION - Single source of truth
// ============================================================================

/**
 * Allowed hostnames for the app subdomain.
 * Uses exact match to prevent host header injection attacks.
 * NOTE: app.sparlo.ai subdomain is deprecated - all traffic stays on sparlo.ai
 */
const ALLOWED_APP_HOSTS = new Set(['localhost', '127.0.0.1']);

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
 * MUST match PUBLIC_PATHS in apps/web/config/subdomain.config.ts
 */
const PUBLIC_PATHS_ON_SUBDOMAIN = [
  '/auth',
  '/api',
  '/share',
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
 * Circuit breaker thresholds to prevent infinite redirect loops.
 * If more than MAX_REDIRECTS_IN_WINDOW occur within REDIRECT_WINDOW_MS,
 * further redirects are blocked until the window expires.
 */
const MAX_REDIRECTS_IN_WINDOW = 3;
const REDIRECT_WINDOW_MS = 10_000; // 10 seconds

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
  } catch {
    // Don't expose error details in production
    console.error('[AuthListener] Failed to check subdomain');
    return false;
  }
}

/**
 * Check if a path is public on the app subdomain.
 */
function isPublicPathOnSubdomain(pathname: string): boolean {
  const normalized = pathname.split('?')[0] ?? pathname; // Remove query string
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
    // Don't expose the invalid domain in production logs
    console.error('[AuthListener] Invalid redirect domain configuration');
    return 'https://sparlo.ai/auth/sign-in';
  }

  // Use current protocol for localhost development (exact match for security)
  const protocol =
    domain === 'localhost' || domain === '127.0.0.1' ? 'http' : 'https';
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
// CIRCUIT BREAKER
// ============================================================================

/**
 * Circuit breaker to prevent infinite redirect loops.
 * Tracks redirect count within a time window and blocks when threshold exceeded.
 *
 * @param redirectCountRef - Ref tracking number of redirects in current window
 * @param lastRedirectTimeRef - Ref tracking timestamp of last redirect
 * @returns true if redirect is allowed, false if circuit breaker tripped
 */
function checkRedirectAllowed(
  redirectCountRef: React.MutableRefObject<number>,
  lastRedirectTimeRef: React.MutableRefObject<number>,
): boolean {
  const now = Date.now();
  const timeSinceLastRedirect = now - lastRedirectTimeRef.current;

  if (timeSinceLastRedirect < REDIRECT_WINDOW_MS) {
    redirectCountRef.current++;

    if (redirectCountRef.current > MAX_REDIRECTS_IN_WINDOW) {
      // Log without exposing internal config details (security)
      console.error('[AuthListener] Circuit breaker: redirect loop detected');
      return false; // Circuit breaker tripped
    }
  } else {
    // New time window - reset counter
    redirectCountRef.current = 1;
  }

  lastRedirectTimeRef.current = now;
  return true; // OK to proceed
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
  if (
    !user &&
    event === 'SIGNED_OUT' &&
    isPrivateRoute(pathname, privatePathPrefixes)
  ) {
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
  const redirectCountRef = useRef<number>(0);
  const lastRedirectTimeRef = useRef<number>(0);

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

      // Execute action
      switch (action.type) {
        case 'REDIRECT_TO_MAIN_AUTH':
          if (!checkRedirectAllowed(redirectCountRef, lastRedirectTimeRef))
            return;
          isRedirectingRef.current = true;
          redirectToMainDomainAuth();
          break;

        case 'REDIRECT_TO_ROOT':
          if (!checkRedirectAllowed(redirectCountRef, lastRedirectTimeRef))
            return;
          isRedirectingRef.current = true;
          debugLog('redirectToRoot', {});
          window.location.assign('/');
          break;

        case 'RELOAD':
          if (!checkRedirectAllowed(redirectCountRef, lastRedirectTimeRef))
            return;
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
              if (!checkRedirectAllowed(redirectCountRef, lastRedirectTimeRef))
                return;
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
