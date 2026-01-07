import 'server-only';

import { cache } from 'react';

import { SupabaseClient } from '@supabase/supabase-js';

import { Database } from '~/lib/database.types';

export interface TeamAccount {
  id: string;
  name: string;
  slug: string;
  pictureUrl: string | null;
  memberCount: number;
}

/**
 * Load teams that the current user belongs to with member counts.
 * Cached per-request to avoid duplicate fetches.
 */
export const loadTeamsPageData = cache(teamsPageLoader);

async function teamsPageLoader(
  client: SupabaseClient<Database>,
): Promise<TeamAccount[]> {
  // Get the current user's team accounts (only non-personal accounts with slugs)
  const { data: accounts, error: accountsError } = await client
    .from('user_accounts')
    .select('id, name, slug, picture_url')
    .not('slug', 'is', null);

  if (accountsError) {
    throw new Error(`Failed to load team accounts: ${accountsError.message}`);
  }

  if (!accounts || accounts.length === 0) {
    return [];
  }

  // Filter out accounts without IDs (shouldn't happen, but type safety)
  const validAccounts = accounts.filter(
    (account): account is typeof account & { id: string; slug: string } =>
      account.id !== null && account.slug !== null,
  );

  if (validAccounts.length === 0) {
    return [];
  }

  // Get member counts for all teams in parallel
  const memberCountPromises = validAccounts.map(async (account) => {
    const { count, error } = await client
      .from('accounts_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);

    if (error) {
      throw new Error(
        `Failed to load member count for ${account.name}: ${error.message}`,
      );
    }

    return { accountId: account.id, count: count ?? 0 };
  });

  const memberCounts = await Promise.all(memberCountPromises);
  const countMap = new Map(memberCounts.map((mc) => [mc.accountId, mc.count]));

  return validAccounts.map((account) => ({
    id: account.id,
    name: account.name ?? 'Unnamed Team',
    slug: account.slug,
    pictureUrl: account.picture_url,
    memberCount: countMap.get(account.id) ?? 0,
  }));
}
