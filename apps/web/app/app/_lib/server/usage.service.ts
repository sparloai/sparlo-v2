import 'server-only';

import { cache } from 'react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';
import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

/**
 * Discriminated union for usage status.
 * Ensures type safety by coupling `allowed` with valid `reason` values.
 */
export type UsageStatus =
  | {
      allowed: true;
      reason: 'ok';
      tokensUsed: number;
      tokensLimit: number;
      percentage: number;
      periodEnd: string | null;
      showUsageBar: boolean;
      isWarning: boolean;
      isAtLimit: false;
    }
  | {
      allowed: false;
      reason: 'limit_exceeded';
      tokensUsed: number;
      tokensLimit: number;
      percentage: number;
      periodEnd: string | null;
      showUsageBar: boolean;
      isWarning: boolean;
      isAtLimit: true;
    };

/**
 * Check if the account is allowed to generate a new report based on usage limits.
 * Pure token-based gating: if user has >= 350k tokens, allow. Otherwise, block.
 * Super admins bypass all usage limits.
 * Wrapped with React cache() for request-level deduplication.
 */
export const checkUsageAllowed = cache(async function checkUsageAllowedImpl(
  accountId: string,
  estimatedTokens: number = USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
): Promise<UsageStatus> {
  const client = getSupabaseServerClient();

  // Check super admin status first - they bypass all limits
  const { data: isSuperAdmin } = (await (client.rpc as CallableFunction)(
    'is_super_admin',
  )) as { data: boolean | null; error: Error | null };

  if (isSuperAdmin) {
    return {
      allowed: true,
      reason: 'ok',
      tokensUsed: 0,
      tokensLimit: Number.MAX_SAFE_INTEGER,
      percentage: 0,
      periodEnd: null,
      showUsageBar: false,
      isWarning: false,
      isAtLimit: false,
    };
  }

  // Check token availability via RPC
  const { data, error } = await (client.rpc as CallableFunction)(
    'check_usage_allowed',
    {
      p_account_id: accountId,
      p_estimated_tokens: estimatedTokens,
    },
  );

  if (error) {
    console.error('[Usage] Failed to check usage:', error);
    return {
      allowed: false,
      reason: 'limit_exceeded',
      tokensUsed: 0,
      tokensLimit: 0,
      percentage: 100,
      periodEnd: null,
      showUsageBar: false,
      isWarning: false,
      isAtLimit: true,
    };
  }

  // Validate JSONB response at runtime
  const validated = UsageCheckResponseSchema.safeParse(data);

  if (!validated.success) {
    console.error(
      '[Usage] Invalid response shape:',
      validated.error,
      'Raw data:',
      data,
    );
    return {
      allowed: false,
      reason: 'limit_exceeded',
      tokensUsed: 0,
      tokensLimit: 0,
      percentage: 100,
      periodEnd: null,
      showUsageBar: false,
      isWarning: false,
      isAtLimit: true,
    };
  }

  const { data: usage } = validated;

  if (usage.allowed) {
    return {
      allowed: true,
      reason: 'ok',
      tokensUsed: usage.tokens_used,
      tokensLimit: usage.tokens_limit,
      percentage: usage.percentage,
      periodEnd: usage.period_end ?? null,
      showUsageBar:
        usage.percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
      isWarning: usage.percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD,
      isAtLimit: false,
    };
  }

  return {
    allowed: false,
    reason: 'limit_exceeded',
    tokensUsed: usage.tokens_used,
    tokensLimit: usage.tokens_limit,
    percentage: usage.percentage,
    periodEnd: usage.period_end ?? null,
    showUsageBar:
      usage.percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
    isWarning: usage.percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD,
    isAtLimit: true,
  };
});
