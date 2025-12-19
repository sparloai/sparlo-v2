import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';
import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

export interface UsageStatus {
  allowed: boolean;
  tokensUsed: number;
  tokensLimit: number;
  remaining: number;
  percentage: number;
  reportsCount: number;
  chatTokensUsed: number;
  periodEnd: string;
  showUsageBar: boolean;
  isWarning: boolean;
  isAtLimit: boolean;
}

/**
 * Check if the account is allowed to generate a new report based on usage limits.
 *
 * Note: After applying the migration, regenerate types with:
 * pnpm supabase:web:typegen
 */
export async function checkUsageAllowed(
  accountId: string,
  estimatedTokens: number = USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
): Promise<UsageStatus> {
  const client = getSupabaseServerClient();

  // Type assertion needed until migration is applied and types regenerated
  const { data, error } = await (client.rpc as CallableFunction)(
    'check_usage_allowed',
    {
      p_account_id: accountId,
      p_estimated_tokens: estimatedTokens,
    },
  );

  if (error) {
    console.error('[Usage] Failed to check usage:', error);
    throw new Error('Failed to check usage limits');
  }

  // Validate JSONB response at runtime
  const validated = UsageCheckResponseSchema.safeParse(data);

  if (!validated.success) {
    console.error('[Usage] Invalid response shape:', validated.error);
    throw new Error('Invalid usage data from database');
  }

  const { data: usage } = validated;

  return {
    allowed: usage.allowed,
    tokensUsed: usage.tokens_used,
    tokensLimit: usage.tokens_limit,
    remaining: usage.remaining,
    percentage: usage.percentage,
    reportsCount: usage.reports_count,
    chatTokensUsed: usage.chat_tokens_used,
    periodEnd: usage.period_end,
    showUsageBar:
      usage.percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
    isWarning: usage.percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD,
    isAtLimit: !usage.allowed,
  };
}
