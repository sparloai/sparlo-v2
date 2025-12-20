import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export type ReportMode = 'discovery' | 'standard';

export interface RecentReport {
  id: string;
  title: string;
  created_at: string;
  mode: ReportMode;
}

interface RawRecentReport {
  id: string;
  title: string;
  created_at: string;
  report_data: { mode?: string } | null;
}

/**
 * Load the 5 most recent non-archived reports for a user.
 * Returns empty array on error to gracefully degrade.
 */
export async function loadRecentReports(
  userId: string,
): Promise<RecentReport[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, created_at, report_data')
    .eq('account_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[Reports] Failed to load recent:', error);
    return [];
  }

  const rows = data as unknown as RawRecentReport[] | null;

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      created_at: row.created_at,
      mode: (row.report_data?.mode === 'discovery'
        ? 'discovery'
        : 'standard') as ReportMode,
    })) ?? []
  );
}
