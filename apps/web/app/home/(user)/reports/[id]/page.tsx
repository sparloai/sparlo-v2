import 'server-only';

import { cache } from 'react';

import { notFound } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { DiscoveryReportDisplay } from './_components/discovery-report-display';
import { ReportDisplay } from './_components/report-display';
import { ReportRenderer } from './_components/report/report-renderer';
import { SparloReportSchema } from './_lib/schema/sparlo-report.schema';
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

  // If no report data, show the legacy display
  if (!report.report_data) {
    return (
      <ReportDisplay report={report} initialChatHistory={initialChatHistory} />
    );
  }

  // Check if this is a discovery mode report
  const isDiscoveryReport = report.report_data.mode === 'discovery';

  if (isDiscoveryReport) {
    // Discovery reports use ReportDisplay for chat functionality, with discovery flag
    return (
      <ReportDisplay
        report={report}
        initialChatHistory={initialChatHistory}
        isDiscovery
      />
    );
  }

  // Validate the report data against SparloReportSchema
  const result = SparloReportSchema.safeParse(report.report_data);

  if (!result.success) {
    // Log detailed validation errors for debugging schema mismatches
    const flatErrors = result.error.flatten();
    console.warn('[Report Rendering] SparloReportSchema validation failed:', {
      reportId: id,
      errorCount: result.error.errors.length,
      fieldErrors: flatErrors.fieldErrors,
      formErrors: flatErrors.formErrors,
      // Log which top-level fields exist vs expected to diagnose schema drift
      presentFields: report.report_data ? Object.keys(report.report_data) : [],
      expectedFields: [
        'header',
        'brief',
        'executive_summary',
        'constraints',
        'problem_analysis',
        'key_patterns',
        'solution_concepts',
        'validation_summary',
        'challenge_the_frame',
        'risks_and_watchouts',
        'next_steps',
        'appendix',
        'metadata',
      ],
    });

    // Fall back to legacy display with markdown rendering
    return (
      <ReportDisplay report={report} initialChatHistory={initialChatHistory} />
    );
  }

  // Render the validated structured report
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
