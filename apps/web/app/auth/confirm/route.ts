import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

const APP_SUBDOMAIN = 'app';
const PRODUCTION_DOMAIN = 'sparlo.ai';

/**
 * Paths that should stay on the main domain.
 */
const MAIN_DOMAIN_PATHS = ['/auth', '/share', '/api', '/healthcheck'];

/**
 * Validate redirect path to prevent open redirect vulnerabilities.
 * Only allows relative paths that are safe app paths.
 */
function isValidRedirectPath(path: string): boolean {
  // Must be a string
  if (typeof path !== 'string') return false;

  // Must start with / (relative path)
  if (!path.startsWith('/')) return false;

  // Reject protocol-relative URLs (//example.com)
  if (path.startsWith('//')) return false;

  // Reject any URL with protocol (javascript:, data:, http:, etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false;

  // Allow /home/* paths (main domain) and clean app paths
  // Disallow main domain paths that shouldn't be redirect targets
  const isMainDomainPath = MAIN_DOMAIN_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  return !isMainDomainPath;
}

/**
 * Check if a path is an app path that should live on the app subdomain.
 */
function isAppPath(path: string): boolean {
  const isMainDomainPath = MAIN_DOMAIN_PATHS.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  return !isMainDomainPath;
}

/**
 * Get the app subdomain URL for a given path.
 * Handles both /home/* paths (from middleware redirects) and clean paths.
 */
function getAppSubdomainUrl(path: string): string {
  const appPath = path.startsWith('/home')
    ? path.replace(/^\/home/, '') || '/'
    : path;

  return `https://${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}${appPath}`;
}

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  // Check if this is a PKCE flow (code parameter) or token_hash flow
  const authCode = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');

  // Validate callback parameter to prevent open redirect
  const callbackRedirect = searchParams.get('callback');
  const redirectPath =
    callbackRedirect && isValidRedirectPath(callbackRedirect)
      ? callbackRedirect
      : pathsConfig.app.home;

  const isProduction = process.env.NODE_ENV === 'production';

  if (authCode) {
    // PKCE flow - use exchangeCodeForSession
    const { nextPath } = await service.exchangeCodeForSession(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath,
    });

    // Redirect to app subdomain in production for app paths
    if (isProduction && isAppPath(nextPath)) {
      return redirect(getAppSubdomainUrl(nextPath));
    }

    return redirect(nextPath);
  } else if (tokenHash) {
    // Token hash flow - use verifyTokenHash
    const url = await service.verifyTokenHash(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath,
    });

    // Redirect to app subdomain in production for app paths
    if (isProduction && isAppPath(url.pathname)) {
      const appUrl = getAppSubdomainUrl(url.pathname);
      const finalUrl = new URL(appUrl);
      // Preserve query params
      url.searchParams.forEach((value, key) => {
        finalUrl.searchParams.set(key, value);
      });
      return NextResponse.redirect(finalUrl);
    }

    return NextResponse.redirect(url);
  } else {
    // No valid auth parameter - redirect to error
    return redirect(
      '/auth/callback/error?error=Invalid authentication parameters',
    );
  }
}
