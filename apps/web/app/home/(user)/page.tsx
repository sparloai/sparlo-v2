import { Suspense } from 'react';

import { Loader2 } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReportsDashboard } from './_components/reports-dashboard';
import type { ConversationStatus } from './_lib/types';

interface Report {
  id: string;
  title: string;
  headline: string | null;
  status: ConversationStatus;
  current_step: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

async function getReports(): Promise<Report[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select(
      'id, title, headline, status, current_step, created_at, updated_at, archived',
    )
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }

  // Type assertion needed until typegen runs with headline migration
  return (data as unknown as Report[]) ?? [];
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
