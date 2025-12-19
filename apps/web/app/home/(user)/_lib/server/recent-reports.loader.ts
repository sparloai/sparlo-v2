import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export interface RecentReport {
  id: string;
  title: string;
  created_at: string;
}

/**
 * Load the 5 most recent completed reports for a user.
 * Returns empty array on error to gracefully degrade.
 */
export async function loadRecentReports(
  userId: string,
): Promise<RecentReport[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, created_at')
    .eq('account_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[Reports] Failed to load recent:', error);
    return [];
  }

  return data ?? [];
}
