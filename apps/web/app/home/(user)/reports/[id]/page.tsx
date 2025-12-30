import 'server-only';

import { cache } from 'react';

import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReportDisplay } from './_components/report-display';
import { loadChatHistory } from './_lib/server/chat.loader';

interface ReportPageProps {
  params: Promise<{ id: string }>;
}

interface Report {
  id: string;
  title: string;
  status: string;
  current_step: string | null;
  phase_progress: number | null;
  report_data: Record<string, unknown> | null;
  clarifications: Array<{
    question: string;
    answer?: string;
    askedAt: string;
  }> | null;
  last_message: string | null;
  created_at: string;
}

const loadReport = cache(async (reportId: string): Promise<Report | null> => {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select(
      'id, title, status, current_step, phase_progress, report_data, clarifications, last_message, created_at',
    )
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('Failed to load report:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    status: data.status,
    current_step: data.current_step,
    phase_progress: data.phase_progress,
    report_data: data.report_data as Record<string, unknown> | null,
    clarifications: data.clarifications as Report['clarifications'],
    last_message: data.last_message,
    created_at: data.created_at,
  };
});

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;

  // Load report and chat history in parallel for optimal performance
  const [report, initialChatHistory] = await Promise.all([
    loadReport(id),
    loadChatHistory(id),
  ]);

  if (!report) {
    notFound();
  }

  // If report is still processing, show the processing screen
  if (report.status !== 'complete') {
    return (
      <ReportDisplay
        report={report}
        initialChatHistory={initialChatHistory}
        isProcessing
      />
    );
  }

  // Render the report (BrandSystemReport handles all report types)
  return (
    <ReportDisplay report={report} initialChatHistory={initialChatHistory} />
  );
}

export async function generateMetadata({ params }: ReportPageProps) {
  const { id } = await params;
  const report = await loadReport(id);

  return {
    title: report?.title ?? 'Report',
    description: 'Sparlo Innovation Report',
  };
}
