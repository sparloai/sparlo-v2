import { Suspense } from 'react';

import { Loader2 } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { ConversationStatus } from '../_lib/types';
import { ArchivedReportsDashboard } from './_components/archived-reports-dashboard';

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
  created_at: string;
  updated_at: string;
  concept_count: number;
  mode: ReportMode;
}

interface RawReportRow {
  id: string;
  title: string;
  headline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  report_data: ReportData | null;
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

async function getArchivedReports(): Promise<Report[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, headline, status, created_at, updated_at, report_data')
    .eq('archived', true)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Failed to fetch archived reports:', error);
    return [];
  }

  const rows = data as unknown as RawReportRow[] | null;

  return (
    rows?.map((row) => {
      const reportData = row.report_data;
      return {
        id: row.id,
        title: row.title,
        headline: row.headline ?? reportData?.headline ?? null,
        status: row.status as ConversationStatus,
        created_at: row.created_at,
        updated_at: row.updated_at,
        concept_count: computeConceptCount(reportData),
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
      <p className="mt-4 text-sm text-[--text-muted]">
        Loading archived reports...
      </p>
    </div>
  );
}

async function ArchivedReportsList() {
  const reports = await getArchivedReports();

  return <ArchivedReportsDashboard reports={reports} />;
}

export default function ArchivedPage() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-[--surface-base]">
      <Suspense fallback={<LoadingState />}>
        <ArchivedReportsList />
      </Suspense>
    </div>
  );
}
