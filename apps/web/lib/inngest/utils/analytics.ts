import 'server-only';

import { analytics } from '@kit/analytics/server';

export type ReportType = 'discovery' | 'hybrid' | 'dd';

interface TrackReportCompletedParams {
  reportId: string;
  reportType: ReportType;
  accountId: string;
  generationTimeMs: number;
  tokenCount?: number;
  costUsd?: number;
  isFirst?: boolean;
}

/**
 * Track report completion events server-side.
 * Called from Inngest functions after report generation completes.
 *
 * This is fire-and-forget - analytics should never block or fail
 * the report completion flow. Errors are logged but not thrown.
 *
 * Note: This tracks internal product metrics (generation times, costs)
 * under GDPR legitimate interest, not user behavioral tracking.
 */
export function trackReportCompleted({
  reportId,
  reportType,
  accountId,
  generationTimeMs,
  tokenCount,
  costUsd,
  isFirst = false,
}: TrackReportCompletedParams): void {
  // Build properties, only including defined values
  const properties: Record<string, string> = {
    report_id: reportId,
    report_type: reportType,
    generation_time_ms: String(generationTimeMs),
    user_id: accountId,
  };

  if (tokenCount !== undefined) {
    properties.token_count = String(tokenCount);
  }
  if (costUsd !== undefined) {
    properties.cost_usd = costUsd.toFixed(4);
  }

  // Fire-and-forget: don't await, just log errors
  analytics.trackEvent('report_completed', properties).catch((error) => {
    console.error('[Analytics] Failed to track report_completed:', error);
  });

  // If this is the user's first report, also track first_report_completed
  if (isFirst) {
    analytics
      .trackEvent('first_report_completed', {
        report_id: reportId,
        report_type: reportType,
        generation_time_ms: String(generationTimeMs),
        user_id: accountId,
      })
      .catch((error) => {
        console.error(
          '[Analytics] Failed to track first_report_completed:',
          error,
        );
      });
  }
}
