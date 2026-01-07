import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type {
  ConversationStatus,
  DashboardReport,
  DashboardReportData,
  ReportMode,
} from '../types';
import { computeConceptCount, extractReportMode } from '../utils/report-utils';

interface RawReportRow {
  id: string;
  title: string;
  headline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  report_data: DashboardReportData | null;
}

/**
 * Load archived reports for the current user.
 * Returns empty array on error to gracefully degrade.
 *
 * Note: Uses idx_sparlo_reports_archived partial index for performance.
 */
export async function loadArchivedReports(): Promise<DashboardReport[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, headline, status, created_at, updated_at, report_data')
    .eq('archived', true)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[Reports] Failed to load archived:', error);
    return [];
  }

  const rows = data as unknown as RawReportRow[] | null;

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      headline: row.headline ?? row.report_data?.headline ?? null,
      status: row.status as ConversationStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
      concept_count: computeConceptCount(row.report_data),
      mode: extractReportMode(row.report_data) as ReportMode,
    })) ?? []
  );
}
