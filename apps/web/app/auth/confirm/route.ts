import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  // Check if this is a PKCE flow (code parameter) or token_hash flow
  const authCode = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');

  if (authCode) {
    // PKCE flow - use exchangeCodeForSession
    const { nextPath } = await service.exchangeCodeForSession(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath: pathsConfig.app.home,
    });

    return redirect(nextPath);
  } else if (tokenHash) {
    // Token hash flow - use verifyTokenHash
    const url = await service.verifyTokenHash(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath: pathsConfig.app.home,
    });

    return NextResponse.redirect(url);
  } else {
    // No valid auth parameter - redirect to error
    return redirect(
      '/auth/callback/error?error=Invalid authentication parameters',
    );
  }
}
