import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import {
  getAppSubdomainUrl,
  isAppPath,
  isValidRedirectPath,
} from '~/config/subdomain.config';

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
  } catch (error) {
    console.error('Auth confirm error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';
    return redirect(
      `/auth/callback/error?error=${encodeURIComponent(errorMessage)}`,
    );
  }
}
