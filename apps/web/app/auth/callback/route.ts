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
    // Log detailed error for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Error',
      code: (error as { code?: string })?.code,
      status: (error as { status?: number })?.status,
    };
    console.error('Auth callback error:', JSON.stringify(errorDetails));

    // Build error URL with debug info
    const errorParams = new URLSearchParams();
    errorParams.set('error', errorDetails.message);
    if (errorDetails.code) {
      errorParams.set('code', errorDetails.code);
    }

    return redirect(`/auth/callback/error?${errorParams.toString()}`);
  }
}
