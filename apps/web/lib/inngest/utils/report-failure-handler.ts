import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

/**
 * Shared handler for Inngest onFailure callbacks.
 * Updates report status to 'failed' with an error message.
 *
 * Uses `.eq('status', 'processing')` to prevent race conditions
 * (e.g., won't overwrite 'cancelled' status if user cancelled during failure).
 */
export async function handleReportFailure(
  reportId: string,
  error: Error,
  step: { run: (name: string, fn: () => Promise<void>) => Promise<unknown> },
) {
  console.error('Report generation failed:', {
    reportId,
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });

  await step.run('update-failed-status', async (): Promise<void> => {
    const supabase = getSupabaseServerAdminClient();
    const { error: updateError } = await supabase
      .from('sparlo_reports')
      .update({
        status: 'failed',
        error_message:
          'Your report failed. Please submit a new analysis request and contact support if it happens repeatedly.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('status', 'processing'); // Prevent race condition with cancellation

    if (updateError) {
      console.error('[onFailure] Failed to update report status:', {
        reportId,
        updateError,
      });
    }
  });
}
