import { cache } from 'react';

import { createAccountsApi } from '@kit/accounts/api';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import featureFlagsConfig from '~/config/feature-flags.config';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import {
  countCompletedReports,
  loadUserReports,
} from './sparlo-reports.loader';

const shouldLoadAccounts = featureFlagsConfig.enableTeamAccounts;

export type UserWorkspace = Awaited<ReturnType<typeof loadUserWorkspace>>;

// Report limits per plan variant ID
const PLAN_REPORT_LIMITS: Record<string, number> = {
  // Free/no subscription
  free: 3,
  // Starter plans
  price_1NNwYHI1i3VnbZTqI2UzaHIe: 10,
  'starter-yearly': 10,
  // Pro plans
  price_1PGOAVI1i3VnbZTqc69xaypm: 50,
  price_pro_yearly: 50,
  // Enterprise plans
  'price_enterprise-monthly': 999,
  price_enterprise_yearly: 999,
};

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

  // Get subscription data for report limits
  let reportLimit = DEFAULT_REPORT_LIMIT;
  try {
    const subscription = await api.getSubscription(user.id);
    if (subscription?.active && subscription.items?.length > 0) {
      const variantId = subscription.items[0]?.variant_id;
      if (variantId && PLAN_REPORT_LIMITS[variantId]) {
        reportLimit = PLAN_REPORT_LIMITS[variantId];
      }
    }
  } catch {
    // No subscription found, use default limit
  }

  return {
    accounts,
    workspace,
    user,
    reportLimit,
    reports,
    reportsUsed,
  };
}
