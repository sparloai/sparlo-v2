'use client';

import { useMemo, useSyncExternalStore } from 'react';

/**
 * Check if we're on the app subdomain.
 * Only call this on the client side after hydration.
 */
function checkIsAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN || 'app';
  const productionDomain =
    process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'sparlo.ai';

  return hostname === `${appSubdomain}.${productionDomain}`;
}

// Store subscription for useSyncExternalStore (no-op since hostname doesn't change)
function subscribe(_callback: () => void) {
  return () => {};
}

// Snapshot functions for useSyncExternalStore
function getSnapshot() {
  return checkIsAppSubdomain();
}

function getServerSnapshot() {
  return false;
}

/**
 * Convert a path to the appropriate format for the current domain.
 * On app subdomain: strips /home prefix for clean URLs
 * On main domain: keeps /home prefix
 *
 * Note: This function is NOT hydration-safe. Use useAppPath hook instead.
 */
export function getAppPath(path: string): string {
  // Always return original path during SSR to avoid hydration mismatch
  if (typeof window === 'undefined') {
    return path;
  }

  if (!checkIsAppSubdomain()) {
    return path;
  }

  // Strip /home prefix for clean app subdomain URLs
  if (path.startsWith('/app')) {
    return path.replace(/^\/home/, '') || '/';
  }

  return path;
}

/**
 * Hook to get path converter for current domain.
 * Returns a function that converts paths appropriately.
 *
 * IMPORTANT: This hook is hydration-safe. During SSR and initial client render,
 * it returns the original path. After hydration, it may transform paths for
 * the app subdomain.
 */
export function useAppPath() {
  // Use useSyncExternalStore for hydration-safe external state
  const onAppSubdomain = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return useMemo(
    () => ({
      /**
       * Convert a path for the current domain.
       * Strips /home prefix when on app subdomain.
       */
      getPath: (path: string): string => {
        if (!onAppSubdomain) return path;
        if (path.startsWith('/app')) {
          return path.replace(/^\/home/, '') || '/';
        }
        return path;
      },
      /**
       * Whether we're on the app subdomain.
       */
      isAppSubdomain: onAppSubdomain,
    }),
    [onAppSubdomain],
  );
}
