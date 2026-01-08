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
  isSubscriber: boolean;
}

/**
 * Load user usage data for display in the UI.
 * Returns null on error to let the caller decide how to handle it.
 *
 * Usage bar is only shown for subscribers - free trial users should not
 * see usage percentage as it's misleading (they only get 1 free report).
 */
export async function loadUserUsage(
  accountId: string,
): Promise<UsageData | null> {
  const client = getSupabaseServerClient();

  // Check usage and subscription status in parallel
  const [usageResult, subscriptionResult] = await Promise.all([
    (client.rpc as CallableFunction)('check_usage_allowed', {
      p_account_id: accountId,
      p_estimated_tokens: 0,
    }),
    client
      .from('subscriptions')
      .select('id')
      .eq('account_id', accountId)
      .or('active.eq.true,and(status.eq.canceled,period_ends_at.gte.now())')
      .maybeSingle(),
  ]);

  if (usageResult.error) {
    console.error('[Usage] Failed to load usage:', usageResult.error);
    return null;
  }

  // Validate JSONB response at runtime
  const validated = UsageCheckResponseSchema.safeParse(usageResult.data);

  if (!validated.success) {
    console.error('[Usage] Invalid response shape:', validated.error);
    return null;
  }

  const { data: usage } = validated;
  const percentage = usage.percentage;
  const isSubscriber = !!subscriptionResult.data;

  return {
    tokensUsed: usage.tokens_used,
    tokensLimit: usage.tokens_limit,
    reportsCount: usage.reports_count,
    periodEnd: usage.period_end ?? '',
    percentage,
    isSubscriber,
    // Only show usage bar for subscribers who are above the threshold
    // Free trial users should not see usage % - it's misleading
    showUsageBar:
      isSubscriber && percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
  };
}
