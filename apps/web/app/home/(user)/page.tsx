import { Suspense } from 'react';

import Link from 'next/link';

import { Loader2, Plus, Sparkles } from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Button } from '@kit/ui/button';

import { AnimatedReportsList } from './_components/animated-reports-list';
import type { ConversationStatus } from './_lib/types';

interface Report {
  id: string;
  title: string;
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
    .select('id, title, status, current_step, created_at, updated_at, archived')
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch reports:', error);
    return [];
  }

  return (data as Report[]) ?? [];
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

  return <AnimatedReportsList reports={reports} />;
}

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-[--surface-base]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-[--text-primary]">
              <Sparkles className="h-6 w-6 text-[--accent]" />
              Your Reports
            </h1>
            <p className="mt-1 text-sm text-[--text-muted]">
              Innovation reports for your engineering challenges
            </p>
          </div>
          <Link href="/home/reports/new">
            <Button
              size="lg"
              className="bg-[--accent] text-white hover:bg-[--accent-hover]"
              style={{ boxShadow: '0 4px 14px -2px rgba(139, 92, 246, 0.4)' }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </Link>
        </div>

        {/* Reports List */}
        <Suspense fallback={<LoadingState />}>
          <ReportsList />
        </Suspense>
      </div>
    </div>
  );
}
