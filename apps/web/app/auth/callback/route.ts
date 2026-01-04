import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';
import { getAppSubdomainUrl, isAppPath } from '~/config/subdomain.config';

export async function GET(request: NextRequest) {
  try {
    const service = createAuthCallbackService(getSupabaseServerClient());

    const { nextPath } = await service.exchangeCodeForSession(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath: pathsConfig.app.home,
    });

    // In production, redirect app paths to app subdomain
    // Auth callbacks land on main domain, but app lives on subdomain
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && isAppPath(nextPath)) {
      const appUrl = getAppSubdomainUrl(nextPath);
      return redirect(appUrl);
    }

    return redirect(nextPath);
  } catch (error) {
    console.error('Auth callback error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Authentication failed';
    return redirect(
      `/auth/callback/error?error=${encodeURIComponent(errorMessage)}`,
    );
  }
}
