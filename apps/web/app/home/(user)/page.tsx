import { Suspense } from 'react';

import { Loader2 } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReportsDashboard } from './_components/reports-dashboard';
import type { ConversationStatus } from './_lib/types';

export type ReportMode = 'discovery' | 'standard';

interface ReportData {
  solution_concepts?: {
    lead_concepts?: unknown[];
    other_concepts?: unknown[];
    spark_concept?: unknown;
  };
  headline?: string;
  mode?: string;
}

interface Report {
  id: string;
  title: string;
  headline: string | null;
  status: ConversationStatus;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  concept_count: number;
  error_message: string | null;
  mode: ReportMode;
}

// Raw DB row type (types may be stale - headline added in migration 20251218100000)
interface RawReportRow {
  id: string;
  title: string;
  headline: string | null;
  status: string;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
  report_data: ReportData | null;
  error_message: string | null;
}

function computeConceptCount(reportData: ReportData | null): number {
  if (!reportData?.solution_concepts) return 0;
  const { lead_concepts, other_concepts, spark_concept } =
    reportData.solution_concepts;
  return (
    (lead_concepts?.length ?? 0) +
    (other_concepts?.length ?? 0) +
    (spark_concept ? 1 : 0)
  );
}

async function getReports(): Promise<Report[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select(
      'id, title, headline, status, current_step, created_at, updated_at, archived, report_data, error_message',
    )
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }

  // Cast to raw type since Supabase types may be stale
  const rows = data as unknown as RawReportRow[] | null;

  return (
    rows?.map((row) => {
      const reportData = row.report_data;
      return {
        id: row.id,
        title: row.title,
        headline: row.headline ?? reportData?.headline ?? null,
        status: row.status as ConversationStatus,
        current_step: row.current_step,
        created_at: row.created_at,
        updated_at: row.updated_at,
        archived: row.archived,
        concept_count: computeConceptCount(reportData),
        error_message: row.error_message,
        mode: (reportData?.mode === 'discovery'
          ? 'discovery'
          : 'standard') as ReportMode,
      };
    }) ?? []
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[--accent]" />
      <p className="mt-4 text-sm text-[--text-muted]">Loading reports...</p>
    </div>
  );
}

async function ReportsList() {
  const reports = await getReports();

  return <ReportsDashboard reports={reports} />;
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-[--surface-base]">
      <Suspense fallback={<LoadingState />}>
        <ReportsList />
      </Suspense>
    </div>
  );
}
