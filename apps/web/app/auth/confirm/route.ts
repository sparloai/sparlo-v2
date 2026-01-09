import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

/**
 * Validate redirect path to prevent open redirect vulnerabilities.
 * Only allows relative paths starting with /.
 */
function isValidRedirectPath(path: string): boolean {
  if (typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return false;
  return true;
}

export async function GET(request: NextRequest) {
  try {
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

      return redirect(nextPath);
    } else if (tokenHash) {
      // Token hash flow - use verifyTokenHash
      const url = await service.verifyTokenHash(request, {
        joinTeamPath: pathsConfig.app.joinTeam,
        redirectPath,
      });

      // Use redirect() instead of NextResponse.redirect() to ensure
      // session cookies set by verifyOtp are included in the response
      return redirect(url.pathname + url.search);
    } else {
      // No valid auth parameter - redirect to error
      return redirect(
        '/auth/callback/error?error=Invalid authentication parameters',
      );
    }
  } catch (error) {
    // Re-throw redirect errors - they're expected behavior, not actual errors
    if (isRedirectError(error)) {
      throw error;
    }

    console.error('Auth confirm error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';
    return redirect(
      `/auth/callback/error?error=${encodeURIComponent(errorMessage)}`,
    );
  }
}
