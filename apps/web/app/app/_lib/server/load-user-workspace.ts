import { cache } from 'react';

import { createAccountsApi } from '@kit/accounts/api';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import featureFlagsConfig from '~/config/feature-flags.config';
import { checkTeamsAccess, getReportLimit } from '~/lib/billing/plan-limits';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import {
  countCompletedReports,
  loadUserReports,
} from './sparlo-reports.loader';

const shouldLoadAccounts = featureFlagsConfig.enableTeamAccounts;

export type UserWorkspace = Awaited<ReturnType<typeof loadUserWorkspace>>;

const DEFAULT_REPORT_LIMIT = 3;

/**
 * @name loadUserWorkspace
 * @description
 * Load the user workspace data. It's a cached per-request function that fetches the user workspace data.
 * It can be used across the server components to load the user workspace data.
 */
export const loadUserWorkspace = cache(workspaceLoader);

async function workspaceLoader() {
  const client = getSupabaseServerClient();
  const api = createAccountsApi(client);

  const accountsPromise = shouldLoadAccounts
    ? () => api.loadUserAccounts()
    : () => Promise.resolve([]);

  const workspacePromise = api.getAccountWorkspace();

  const [accounts, workspace, user] = await Promise.all([
    accountsPromise(),
    workspacePromise,
    requireUserInServerComponent(),
  ]);

  // Fetch reports and count from database in parallel
  const [reports, reportsUsed] = await Promise.all([
    loadUserReports(user.id),
    countCompletedReports(user.id),
  ]);

  // Get subscription data for report limits and teams access
  let reportLimit = DEFAULT_REPORT_LIMIT;
  let hasTeamsAccess = false;

  try {
    const subscription = await api.getSubscription(user.id);
    if (subscription?.active && subscription.items?.length > 0) {
      const variantId = subscription.items[0]?.variant_id;
      if (variantId) {
        // Get report limit and teams access from billing config (single source of truth)
        reportLimit = getReportLimit(variantId);
        hasTeamsAccess = checkTeamsAccess(variantId);
      }
    }
  } catch (error) {
    console.error('[load-user-workspace] Failed to fetch subscription:', error);
  }

  return {
    accounts,
    workspace,
    user,
    reportLimit,
    reports,
    reportsUsed,
    hasTeamsAccess,
  };
}
