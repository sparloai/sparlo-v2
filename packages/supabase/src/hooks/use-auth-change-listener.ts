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
 * @description Paths that are public on the app subdomain (don't require auth)
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
 * Uses environment variables for domain configuration.
 */
function isAppSubdomain(): boolean {
  if (typeof window === 'undefined') return false;

  const hostname = window.location.hostname;
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN ?? 'app';
  const productionDomain = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN ?? 'sparlo.ai';
  const appSubdomainHost = `${appSubdomain}.${productionDomain}`;

  return hostname === appSubdomainHost;
}

/**
 * Check if a path is public on the app subdomain.
 */
function isPublicPathOnSubdomain(pathname: string): boolean {
  return PUBLIC_PATHS_ON_SUBDOMAIN.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * @name useAuthChangeListener
 * @param privatePathPrefixes - A list of private path prefixes
 * @param appHomePath - The path to redirect to when the user is signed out
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
          const productionDomain = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN ?? 'sparlo.ai';
          window.location.assign(`https://${productionDomain}/auth/sign-in`);
          return;
        }

        // On main domain, redirect to home
        window.location.assign('/');
        return;
      }

      // revalidate user session when user signs in or out
      // Only reload if user was previously signed in to prevent infinite loops
      if (event === 'SIGNED_OUT' && hadSessionRef.current) {
        // sometimes Supabase sends SIGNED_OUT event
        // but in the auth path, so we ignore it
        if (AUTH_PATHS.some((path) => pathName.startsWith(path))) {
          return;
        }

        // On app subdomain, redirect to main domain instead of reloading
        // This prevents refresh loops caused by session desync between domains
        if (isAppSubdomain()) {
          const productionDomain = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN ?? 'sparlo.ai';
          window.location.assign(`https://${productionDomain}/auth/sign-in`);
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

/**
 * Determines if a given path is a private route.
 * On the app subdomain, all paths except public paths are private.
 * On the main domain, uses the prefix list.
 */
function isPrivateRoute(path: string, privatePathPrefixes: string[]): boolean {
  // On app subdomain, all paths except public paths are private
  if (isAppSubdomain()) {
    return !isPublicPathOnSubdomain(path);
  }

  // On main domain, use the prefix list
  return privatePathPrefixes.some((prefix) => path.startsWith(prefix));
}
