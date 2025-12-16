import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { ReportDisplay } from './_components/report-display';

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

async function loadReport(reportId: string): Promise<Report | null> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('id, title, status, current_step, phase_progress, report_data, clarifications, last_message, created_at')
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
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params;
  const report = await loadReport(id);

  if (!report) {
    notFound();
  }

  // If report is still processing, show the processing screen
  if (report.status !== 'complete') {
    return <ReportDisplay report={report} isProcessing />;
  }

  return <ReportDisplay report={report} />;
}

export async function generateMetadata({ params }: ReportPageProps) {
  const { id } = await params;
  const report = await loadReport(id);

  return {
    title: report?.title ?? 'Report',
    description: 'Sparlo Innovation Report',
  };
}
