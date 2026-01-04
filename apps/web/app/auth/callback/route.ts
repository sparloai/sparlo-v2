import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { createAuthCallbackService } from '@kit/supabase/auth';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import pathsConfig from '~/config/paths.config';

const APP_SUBDOMAIN = 'app';
const PRODUCTION_DOMAIN = 'sparlo.ai';

/**
 * Get the app subdomain URL for a given path.
 * Handles both /home/* paths (from middleware redirects) and clean paths.
 */
function getAppSubdomainUrl(path: string): string {
  // If path starts with /home, strip the prefix
  // Otherwise, use the path as-is (it's already a clean app path)
  const appPath = path.startsWith('/home')
    ? path.replace(/^\/home/, '') || '/'
    : path;

  return `https://${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}${appPath}`;
}

/**
 * Check if a path is an app path that should live on the app subdomain.
 * App paths include: /, /settings, /billing, /[account], etc.
 * Non-app paths include: /auth/*, /share/*, etc.
 */
function isAppPath(path: string): boolean {
  // Paths that should stay on the main domain
  const mainDomainPaths = ['/auth', '/share', '/api', '/healthcheck'];

  // Check if the path starts with any main domain paths
  const isMainDomainPath = mainDomainPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  return !isMainDomainPath;
}

export async function GET(request: NextRequest) {
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
}
