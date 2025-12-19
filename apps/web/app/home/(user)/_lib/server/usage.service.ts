import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { PLAN_TOKEN_LIMITS, USAGE_CONSTANTS } from '~/lib/usage/constants';
import {
  IncrementUsageResponseSchema,
  UsageCheckResponseSchema,
} from '~/lib/usage/schemas';

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

/**
 * Get the token limit for an account based on their subscription plan.
 */
export async function getTokenLimitForAccount(
  accountId: string,
): Promise<number> {
  const client = getSupabaseServerClient();

  try {
    const { data: subscription, error } = await client
      .from('subscriptions')
      .select(
        `
        active,
        subscription_items (variant_id)
      `,
      )
      .eq('account_id', accountId)
      .eq('active', true)
      .maybeSingle();

    if (error) {
      console.error('[Usage] Failed to fetch subscription:', error);
      return USAGE_CONSTANTS.DEFAULT_TOKEN_LIMIT;
    }

    if (!subscription) {
      return USAGE_CONSTANTS.DEFAULT_TOKEN_LIMIT;
    }

    const items = subscription.subscription_items as Array<{
      variant_id: string;
    }> | null;
    const variantId = items?.[0]?.variant_id;

    if (variantId && variantId in PLAN_TOKEN_LIMITS) {
      return PLAN_TOKEN_LIMITS[variantId]!;
    }

    return USAGE_CONSTANTS.DEFAULT_TOKEN_LIMIT;
  } catch (err) {
    console.error('[Usage] Unexpected error:', err);
    return USAGE_CONSTANTS.DEFAULT_TOKEN_LIMIT;
  }
}

/**
 * Increment usage after a report or chat message is completed.
 */
export async function incrementUsage(
  accountId: string,
  tokens: number,
  options: { isReport?: boolean; isChat?: boolean } = {},
): Promise<void> {
  const client = getSupabaseServerClient();

  // Type assertion needed until migration is applied and types regenerated
  const { data, error } = await (client.rpc as CallableFunction)(
    'increment_usage',
    {
      p_account_id: accountId,
      p_tokens: tokens,
      p_is_report: options.isReport ?? false,
      p_is_chat: options.isChat ?? false,
    },
  );

  if (error) {
    console.error('[Usage] Failed to increment usage:', error);
    throw new Error('Failed to record usage');
  }

  // Validate response
  const validated = IncrementUsageResponseSchema.safeParse(data);
  if (!validated.success) {
    console.error('[Usage] Invalid increment response:', validated.error);
    // Don't throw - usage was recorded, just couldn't parse response
  }

  console.log('[Usage] Incremented:', {
    accountId,
    tokens,
    newTotal: validated.success ? validated.data.tokens_used : 'unknown',
  });
}

/**
 * Ensure a usage period exists for the account.
 * Creates one if it doesn't exist.
 */
export async function ensureUsagePeriod(accountId: string): Promise<void> {
  const client = getSupabaseServerClient();
  const tokenLimit = await getTokenLimitForAccount(accountId);

  // Type assertion needed until migration is applied and types regenerated
  const { error } = await (client.rpc as CallableFunction)(
    'get_or_create_usage_period',
    {
      p_account_id: accountId,
      p_tokens_limit: tokenLimit,
    },
  );

  if (error) {
    console.error('[Usage] Failed to ensure usage period:', error);
    throw new Error('Failed to initialize usage period');
  }
}
