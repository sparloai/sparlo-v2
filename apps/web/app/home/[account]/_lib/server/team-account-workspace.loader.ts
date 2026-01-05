import 'server-only';

import { cache } from 'react';

import { notFound, redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createTeamAccountsApi } from '@kit/team-accounts/api';

import pathsConfig from '~/config/paths.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

/**
 * Reserved slugs that should be handled by the (user) route group.
 * These paths exist as static routes in /home/(user)/ and should NOT
 * be caught by the [account] dynamic segment.
 *
 * If Next.js mistakenly routes /home/reports/new to /home/[account]
 * with account='reports', this check triggers a 404 which prevents
 * the redirect loop to /home.
 */
const RESERVED_SLUGS = new Set([
  'reports',
  'settings',
  'billing',
  'billing-2',
  'teams',
  'archived',
  'help',
]);

export type TeamAccountWorkspace = Awaited<
  ReturnType<typeof loadTeamWorkspace>
>;

/**
 * Load the account workspace data.
 * We place this function into a separate file so it can be reused in multiple places across the server components.
 *
 * This function is used in the layout component for the account workspace.
 * It is cached so that the data is only fetched once per request.
 *
 * @param accountSlug
 */
export const loadTeamWorkspace = cache(workspaceLoader);

async function workspaceLoader(accountSlug: string) {
  // Prevent [account] from catching paths meant for (user) route group.
  // This is a safety check in case Next.js routing prioritizes dynamic
  // segments over static route group paths.
  if (RESERVED_SLUGS.has(accountSlug)) {
    console.warn(
      `[loadTeamWorkspace] Reserved slug "${accountSlug}" caught by [account] route. ` +
        'This indicates a Next.js routing issue - static routes in (user) should take precedence.',
    );
    notFound();
  }

  const client = getSupabaseServerClient();
  const api = createTeamAccountsApi(client);

  const [workspace, user] = await Promise.all([
    api.getAccountWorkspace(accountSlug),
    requireUserInServerComponent(),
  ]);

  // we cannot find any record for the selected account
  // so we redirect the user to the home page
  if (!workspace.data?.account) {
    return redirect(pathsConfig.app.home);
  }

  return {
    ...workspace.data,
    user,
  };
}
