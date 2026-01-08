import 'server-only';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import type { TokenUsage } from '../../llm/client';

/**
 * Persist step token usage to the report's step_tokens column.
 *
 * DHH approach: Store tokens directly on the report row as JSONB.
 * - No extra tables, no extra RPC functions
 * - Data lives with the report (auto-cleanup on delete)
 * - Simple to query for debugging
 *
 * @param reportId - The report being generated
 * @param stepName - The step name (e.g., 'an0', 'an1.5', 'an2')
 * @param usage - Token usage from the LLM call
 * @throws Error if database update fails (intentional - don't swallow billing errors)
 */
export async function persistStepTokens(
  reportId: string,
  stepName: string,
  usage: TokenUsage,
): Promise<void> {
  const supabase = getSupabaseServerAdminClient();

  // Read current step_tokens, merge with new step, write back
  // This is safe because Inngest steps are sequential (no race condition)
  // Note: step_tokens column added in migration 20260108000000
  const { data: report, error: readError } = await supabase
    .from('sparlo_reports')
    .select('step_tokens')
    .eq('id', reportId)
    .single();

  if (readError) {
    console.error('[StepTokens] Failed to read report:', {
      reportId,
      stepName,
      error: readError.message,
    });
    throw new Error(
      `Failed to read report for token tracking: ${readError.message}`,
    );
  }

  // Merge new step tokens with existing
  // Type assertion needed until types are regenerated after migration
  const currentTokens =
    (report as { step_tokens?: Record<string, number> } | null)?.step_tokens ??
    {};
  const updatedTokens = {
    ...currentTokens,
    [stepName]: usage.totalTokens,
  };

  const { error: updateError } = await supabase
    .from('sparlo_reports')
    .update({
      step_tokens: updatedTokens,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (updateError) {
    console.error('[StepTokens] Failed to persist step tokens:', {
      reportId,
      stepName,
      tokens: usage.totalTokens,
      error: updateError.message,
    });
    throw new Error(`Failed to persist step tokens: ${updateError.message}`);
  }

  console.log('[StepTokens] Persisted:', {
    reportId,
    stepName,
    tokens: usage.totalTokens,
  });
}

/**
 * Sum all step tokens from a report's step_tokens column.
 * Used in completion and failure handlers to bill for actual usage.
 *
 * @param reportId - The report to sum tokens for
 * @returns Total tokens across all steps, or 0 if none recorded
 */
export async function sumStepTokens(reportId: string): Promise<number> {
  const supabase = getSupabaseServerAdminClient();

  const { data: report, error } = await supabase
    .from('sparlo_reports')
    .select('step_tokens')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('[StepTokens] Failed to read step_tokens for summing:', {
      reportId,
      error: error.message,
    });
    return 0; // Don't throw - allow completion to proceed
  }

  // Type assertion needed until types are regenerated after migration
  const stepTokens =
    (report as { step_tokens?: Record<string, number> } | null)?.step_tokens ??
    {};
  const total = Object.values(stepTokens).reduce(
    (sum, tokens) => sum + (tokens || 0),
    0,
  );

  console.log('[StepTokens] Summed tokens:', {
    reportId,
    steps: Object.keys(stepTokens).length,
    total,
  });

  return total;
}

/**
 * Bill for completed steps and update report status on failure.
 * Used by onFailure handler to ensure partial billing.
 *
 * @param reportId - The failed report
 * @param accountId - The account to bill
 * @param errorMessage - Error message to store on report
 */
export async function billCompletedStepsOnFailure(
  reportId: string,
  accountId: string,
  errorMessage: string,
): Promise<void> {
  const supabase = getSupabaseServerAdminClient();

  // Sum tokens from completed steps
  const totalTokens = await sumStepTokens(reportId);

  if (totalTokens > 0) {
    // Bill for completed work
    const { error: usageError } = await supabase.rpc('increment_usage', {
      p_account_id: accountId,
      p_tokens: totalTokens,
      p_is_report: true,
      p_is_chat: false,
    });

    if (usageError) {
      console.error('[StepTokens] Failed to bill completed steps:', {
        reportId,
        accountId,
        totalTokens,
        error: usageError.message,
      });
    } else {
      console.log('[StepTokens] Billed for completed steps on failure:', {
        reportId,
        accountId,
        totalTokens,
      });
    }
  }

  // Update report with token usage info
  const { error: updateError } = await supabase
    .from('sparlo_reports')
    .update({
      status: 'failed',
      error_message: errorMessage,
      token_usage: {
        totalTokens,
        note: 'Partial billing - charged for completed steps only',
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('status', 'processing'); // Prevent race with cancellation

  if (updateError) {
    console.error('[StepTokens] Failed to update report status:', {
      reportId,
      error: updateError.message,
    });
  }
}
