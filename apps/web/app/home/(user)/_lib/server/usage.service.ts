import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';
import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

export interface UsageStatus {
  allowed: boolean;
  reason:
    | 'ok'
    | 'first_report_available'
    | 'subscription_required'
    | 'limit_exceeded';
  tokensUsed: number;
  tokensLimit: number;
  percentage: number;
  periodEnd: string | null;
  isFirstReport: boolean;
  hasActiveSubscription: boolean;
  showUsageBar: boolean;
  isWarning: boolean;
  isAtLimit: boolean;
}

/**
 * Check if the account is allowed to generate a new report based on usage limits.
 * Implements freemium model: first report is free, then requires subscription.
 */
export async function checkUsageAllowed(
  accountId: string,
  estimatedTokens: number = USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
): Promise<UsageStatus> {
  const client = getSupabaseServerClient();

  // Check if account has used first free report
  // Note: first_report_used_at column added by migration 20251220231212
  // After migration, regenerate types with: pnpm supabase:web:typegen
  const { data: account, error: accountError } = (await client
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .single()) as unknown as {
    data: { id: string; first_report_used_at?: string | null } | null;
    error: Error | null;
  };

  if (accountError) {
    throw new Error(
      `Failed to check first report status: ${accountError.message}`,
    );
  }

  const hasUsedFirstReport = !!account?.first_report_used_at;

  // Check for active subscription OR canceled subscription still in paid period (grace period)
  const { data: subscription, error: subError } = await client
    .from('subscriptions')
    .select('id, status, period_ends_at')
    .eq('account_id', accountId)
    .or('active.eq.true,and(status.eq.canceled,period_ends_at.gte.now())')
    .maybeSingle();

  if (subError) {
    throw new Error(`Failed to check subscription status: ${subError.message}`);
  }

  const hasActiveSubscription = !!subscription;

  // First report is free
  if (!hasUsedFirstReport) {
    return {
      allowed: true,
      reason: 'first_report_available',
      tokensUsed: 0,
      tokensLimit: USAGE_CONSTANTS.DEFAULT_TOKEN_LIMIT,
      percentage: 0,
      periodEnd: null,
      isFirstReport: true,
      hasActiveSubscription,
      showUsageBar: false,
      isWarning: false,
      isAtLimit: false,
    };
  }

  // No subscription after first report
  if (!hasActiveSubscription) {
    return {
      allowed: false,
      reason: 'subscription_required',
      tokensUsed: 0,
      tokensLimit: 0,
      percentage: 100,
      periodEnd: null,
      isFirstReport: false,
      hasActiveSubscription: false,
      showUsageBar: false,
      isWarning: false,
      isAtLimit: true,
    };
  }

  // Check usage against subscription tier
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
    reason: usage.allowed ? 'ok' : 'limit_exceeded',
    tokensUsed: usage.tokens_used,
    tokensLimit: usage.tokens_limit,
    percentage: usage.percentage,
    periodEnd: subscription.period_ends_at ?? usage.period_end,
    isFirstReport: false,
    hasActiveSubscription: true,
    showUsageBar:
      usage.percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
    isWarning: usage.percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD,
    isAtLimit: !usage.allowed,
  };
}

/**
 * Mark the account's first free report as used.
 * Uses conditional update to handle race conditions.
 */
export async function markFirstReportUsed(accountId: string): Promise<void> {
  const client = getSupabaseServerClient();

  // Call the SQL function that handles the update atomically
  // Note: mark_first_report_used function added by migration 20251220231212
  // After migration, regenerate types with: pnpm supabase:web:typegen
  const { data: wasMarked, error } = (await (client.rpc as CallableFunction)(
    'mark_first_report_used',
    { p_account_id: accountId },
  )) as { data: boolean | null; error: Error | null };

  if (error) {
    throw new Error(`Failed to mark first report used: ${error.message}`);
  }

  if (!wasMarked) {
    // Already marked by concurrent request - this is fine, just log
    console.warn('[Usage] First report already marked for account:', accountId);
  }
}
