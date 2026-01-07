import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';
import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

export interface UsageData {
  tokensUsed: number;
  tokensLimit: number;
  reportsCount: number;
  periodEnd: string;
  percentage: number;
  showUsageBar: boolean;
}

/**
 * Load user usage data for display in the UI.
 * Returns null on error to let the caller decide how to handle it.
 */
export async function loadUserUsage(
  accountId: string,
): Promise<UsageData | null> {
  const client = getSupabaseServerClient();

  // Type assertion needed until migration is applied and types regenerated
  const { data, error } = await (client.rpc as CallableFunction)(
    'check_usage_allowed',
    {
      p_account_id: accountId,
      p_estimated_tokens: 0, // Just checking current usage
    },
  );

  if (error) {
    console.error('[Usage] Failed to load usage:', error);
    return null;
  }

  // Validate JSONB response at runtime
  const validated = UsageCheckResponseSchema.safeParse(data);

  if (!validated.success) {
    console.error('[Usage] Invalid response shape:', validated.error);
    return null;
  }

  const { data: usage } = validated;
  const percentage = usage.percentage;

  return {
    tokensUsed: usage.tokens_used,
    tokensLimit: usage.tokens_limit,
    reportsCount: usage.reports_count,
    periodEnd: usage.period_end,
    percentage,
    showUsageBar: percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
  };
}
