import type { DashboardReportData, ReportMode } from '../types';

/**
 * Format a date for report display.
 * Omits year if current year, uses uppercase formatting.
 */
export function formatReportDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();

  return date
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(isThisYear ? {} : { year: 'numeric' }),
    })
    .toUpperCase();
}

/**
 * Truncate a string to specified length with ellipsis.
 */
export function truncateText(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trim() + '...';
}

/**
 * Compute total concept count from report data.
 */
export function computeConceptCount(
  reportData: DashboardReportData | null,
): number {
  if (!reportData?.solution_concepts) return 0;
  const { lead_concepts, other_concepts, spark_concept } =
    reportData.solution_concepts;
  return (
    (lead_concepts?.length ?? 0) +
    (other_concepts?.length ?? 0) +
    (spark_concept ? 1 : 0)
  );
}

/**
 * Extract mode from report data, defaulting to 'standard'.
 */
export function extractReportMode(
  reportData: DashboardReportData | null,
): ReportMode {
  return reportData?.mode === 'discovery' ? 'discovery' : 'standard';
}
