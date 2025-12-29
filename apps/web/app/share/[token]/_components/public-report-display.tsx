'use client';

import { BrandSystemReport } from '~/home/(user)/reports/[id]/_components/brand-system/brand-system-report';
import type { HybridReportData } from '~/home/(user)/reports/_lib/types/hybrid-report-display.types';
import type { SharedReport } from '~/home/(user)/reports/_lib/types/report-data.types';

interface PublicReportDisplayProps {
  report: SharedReport;
}

export function PublicReportDisplay({ report }: PublicReportDisplayProps) {
  const reportData = report.report_data as {
    mode?: string;
    report?: HybridReportData;
  } | null;

  // Handle hybrid reports with brand system
  if (reportData?.mode === 'hybrid' && reportData.report) {
    return (
      <BrandSystemReport
        reportData={reportData.report}
        title={report.title}
        brief={reportData.report.brief}
        createdAt={report.created_at}
        showToc={true}
        hasAppSidebar={false}
        isChatOpen={false}
        showActions={false}
      />
    );
  }

  // Fallback for legacy/other report types
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-zinc-500">Report content not available</p>
      </div>
    </div>
  );
}
