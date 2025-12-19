import 'server-only';

import { cache } from 'react';

import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { DiscoveryReportDisplay } from './_components/discovery-report-display';
import { ReportDisplay } from './_components/report-display';
import { ReportRenderer } from './_components/report/report-renderer';
import { SparloReportSchema } from './_lib/schema/sparlo-report.schema';

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
  const report = await loadReport(id);

  if (!report) {
    notFound();
  }

  // If report is still processing, show the processing screen
  if (report.status !== 'complete') {
    return <ReportDisplay report={report} isProcessing />;
  }

  // If no report data, show the legacy display
  if (!report.report_data) {
    return <ReportDisplay report={report} />;
  }

  // Check if this is a discovery mode report
  const isDiscoveryReport = report.report_data.mode === 'discovery';

  if (isDiscoveryReport) {
    // Discovery reports have a different schema - render with dedicated component
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <DiscoveryReportDisplay
          reportData={
            report.report_data as Parameters<
              typeof DiscoveryReportDisplay
            >[0]['reportData']
          }
        />
      </div>
    );
  }

  // Validate the report data with Zod schema for standard reports
  const result = SparloReportSchema.safeParse(report.report_data);

  // Fall back to legacy display for reports that don't match the new schema
  if (!result.success) {
    console.warn('Report validation failed, using legacy display:', {
      reportId: id,
      errorCount: result.error.errors.length,
    });
    return <ReportDisplay report={report} />;
  }

  // Render the validated report
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <ReportRenderer report={result.data} />
    </div>
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
