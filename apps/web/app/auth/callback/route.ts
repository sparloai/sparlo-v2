import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

const APP_SUBDOMAIN = 'app';
const PRODUCTION_DOMAIN = 'sparlo.ai';

export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  const { nextPath } = await service.exchangeCodeForSession(request, {
    joinTeamPath: pathsConfig.app.joinTeam,
    redirectPath: pathsConfig.app.home,
  });

  // In production, redirect /home paths to app subdomain
  // Auth callbacks land on main domain, but app lives on subdomain
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && nextPath.startsWith('/home')) {
    // Remove /home prefix and redirect to app subdomain
    const appPath = nextPath.replace(/^\/home/, '') || '/';
    const appUrl = `https://${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}${appPath}`;
    return redirect(appUrl);
  }

  return redirect(nextPath);
}
