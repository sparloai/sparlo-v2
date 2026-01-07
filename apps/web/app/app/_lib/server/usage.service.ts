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
      reason: 'ok' | 'first_report_available';
      tokensUsed: number;
      tokensLimit: number;
      percentage: number;
      periodEnd: string | null;
      isFirstReport: boolean;
      hasActiveSubscription: boolean;
      showUsageBar: boolean;
      isWarning: boolean;
      isAtLimit: false;
    }
  | {
      allowed: false;
      reason: 'subscription_required' | 'limit_exceeded';
      tokensUsed: number;
      tokensLimit: number;
      percentage: number;
      periodEnd: string | null;
      isFirstReport: false;
      hasActiveSubscription: boolean;
      showUsageBar: boolean;
      isWarning: boolean;
      isAtLimit: true;
    };

/**
 * Check if the account is allowed to generate a new report based on usage limits.
 * Implements freemium model: first report is free, then requires subscription.
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
      isFirstReport: false,
      hasActiveSubscription: true,
      showUsageBar: false,
      isWarning: false,
      isAtLimit: false,
    };
  }

  // Execute account and subscription queries in parallel for performance
  // First query all subscriptions for this account (for debugging)
  const [accountResult, subscriptionResult, allSubscriptionsResult] =
    await Promise.all([
      client
        .from('accounts')
        .select('id, first_report_used_at')
        .eq('id', accountId)
        .single(),
      // Query for active subscriptions OR cancelled but still in period
      client
        .from('subscriptions')
        .select('id, status, period_ends_at, active')
        .eq('account_id', accountId)
        .or('active.eq.true,and(status.eq.canceled,period_ends_at.gte.now())')
        .maybeSingle(),
      // Also get all subscriptions for debugging (if first query fails)
      client
        .from('subscriptions')
        .select('id, status, period_ends_at, active')
        .eq('account_id', accountId),
    ]);

  if (accountResult.error) {
    throw new Error(
      `Failed to check first report status: ${accountResult.error.message}`,
    );
  }

  if (subscriptionResult.error) {
    throw new Error(
      `Failed to check subscription status: ${subscriptionResult.error.message}`,
    );
  }

  const account = accountResult.data;
  let subscription = subscriptionResult.data;
  const hasUsedFirstReport = !!account.first_report_used_at;

  // Debug: If no active subscription found but we have subscriptions, log it
  if (!subscription && allSubscriptionsResult.data?.length) {
    console.warn(
      '[Usage] Account has subscriptions but none matched active criteria:',
      {
        accountId,
        subscriptions: allSubscriptionsResult.data,
        hasUsedFirstReport,
      },
    );

    // Fallback: If there's any subscription with a future period_ends_at, use it
    const fallbackSub = allSubscriptionsResult.data.find(
      (s) => new Date(s.period_ends_at) > new Date(),
    );
    if (fallbackSub) {
      console.warn(
        '[Usage] Using fallback subscription with future period_ends_at:',
        fallbackSub,
      );
      subscription = fallbackSub;
    }
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

  const baseStatus = {
    tokensUsed: usage.tokens_used,
    tokensLimit: usage.tokens_limit,
    percentage: usage.percentage,
    periodEnd: subscription?.period_ends_at ?? usage.period_end,
    hasActiveSubscription: true as const,
    showUsageBar:
      usage.percentage >= USAGE_CONSTANTS.USAGE_BAR_VISIBLE_THRESHOLD,
    isWarning: usage.percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD,
  };

  if (usage.allowed) {
    return {
      ...baseStatus,
      allowed: true as const,
      reason: 'ok' as const,
      isFirstReport: false,
      isAtLimit: false as const,
    };
  }

  return {
    ...baseStatus,
    allowed: false as const,
    reason: 'limit_exceeded' as const,
    isFirstReport: false as const,
    isAtLimit: true as const,
  };
});

/**
 * Mark the account's first free report as used.
 * Uses conditional update to handle race conditions.
 * @deprecated Use tryClaimFirstReport for race-condition-safe claiming
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

/**
 * Claim result for tryClaimFirstReport
 */
export type ClaimResult = 'CLAIMED' | 'ALREADY_USED' | 'UNAUTHORIZED';

/**
 * Atomically try to claim the first free report.
 * This prevents the race condition where two concurrent requests could
 * both pass the "is first report available" check.
 *
 * Usage pattern:
 * 1. Call tryClaimFirstReport BEFORE generating the report
 * 2. If 'CLAIMED', proceed with report generation
 * 3. If 'ALREADY_USED', check subscription status and usage limits
 * 4. If 'UNAUTHORIZED', throw authorization error
 */
export async function tryClaimFirstReport(
  accountId: string,
): Promise<ClaimResult> {
  const client = getSupabaseServerClient();

  const { data, error } = (await (client.rpc as CallableFunction)(
    'try_claim_first_report',
    { p_account_id: accountId },
  )) as { data: string | null; error: Error | null };

  if (error) {
    throw new Error(`Failed to claim first report: ${error.message}`);
  }

  const result = data as ClaimResult;

  if (result === 'UNAUTHORIZED') {
    throw new Error('Unauthorized: You do not have access to this account');
  }

  return result;
}
