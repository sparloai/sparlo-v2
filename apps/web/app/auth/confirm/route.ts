import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

// Default redirect after email verification - send users to reports page
const EMAIL_VERIFICATION_REDIRECT = '/home/reports';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  // Check if this is a PKCE flow (code parameter) or token_hash flow
  const authCode = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');

  // Check for custom redirect from callback parameter
  const callbackRedirect = searchParams.get('callback');
  const redirectPath = callbackRedirect || EMAIL_VERIFICATION_REDIRECT;

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

    return NextResponse.redirect(url);
  } else {
    // No valid auth parameter - redirect to error
    return redirect(
      '/auth/callback/error?error=Invalid authentication parameters',
    );
  }
}
