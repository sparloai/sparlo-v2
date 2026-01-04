import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

const APP_SUBDOMAIN = 'app';
const PRODUCTION_DOMAIN = 'sparlo.ai';

/**
 * Validate redirect path to prevent open redirect vulnerabilities.
 * Only allows relative paths within the app (starting with /home or /join).
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

  // Only allow paths within the app (home or join routes)
  const allowedPrefixes = ['/home', '/join'];
  return allowedPrefixes.some((prefix) => path.startsWith(prefix));
}

/**
 * Redirect to app subdomain for /home paths in production.
 */
function redirectToAppSubdomain(path: string): string {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && path.startsWith('/home')) {
    const appPath = path.replace(/^\/home/, '') || '/';
    return `https://${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}${appPath}`;
  }

  return path;
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

  if (authCode) {
    // PKCE flow - use exchangeCodeForSession
    const { nextPath } = await service.exchangeCodeForSession(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath,
    });

    // Redirect to app subdomain for /home paths in production
    const finalPath = redirectToAppSubdomain(nextPath);
    return redirect(finalPath);
  } else if (tokenHash) {
    // Token hash flow - use verifyTokenHash
    const url = await service.verifyTokenHash(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath,
    });

    // Check if URL needs app subdomain redirect
    const urlString = url.toString();
    if (process.env.NODE_ENV === 'production' && urlString.includes('/home')) {
      const appUrl = new URL(url);
      const appPath = appUrl.pathname.replace(/^\/home/, '') || '/';
      return NextResponse.redirect(
        new URL(
          `https://${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}${appPath}${appUrl.search}`,
        ),
      );
    }

    return NextResponse.redirect(url);
  } else {
    // No valid auth parameter - redirect to error
    return redirect(
      '/auth/callback/error?error=Invalid authentication parameters',
    );
  }
}
