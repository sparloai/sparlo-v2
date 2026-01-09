import 'server-only';

import { UpsertSubscriptionParams } from '@kit/billing/types';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { getPlanTokenLimit } from './plan-limits';

/**
 * Handle invoice.paid webhook from Stripe.
 * Creates/resets usage period for the new billing cycle.
 *
 * Called from the webhook route when a subscription invoice is paid.
 * This includes both initial subscription creation and recurring payments.
 */
export async function handleInvoicePaid(
  payload: UpsertSubscriptionParams,
): Promise<void> {
  console.log('[Billing] handleInvoicePaid called with:', {
    accountId: payload.target_account_id,
    priceId: payload.line_items?.[0]?.variant_id,
    periodStart: payload.period_starts_at,
    periodEnd: payload.period_ends_at,
  });

  const supabase = getSupabaseServerAdminClient();

  // Extract relevant data from payload
  const accountId = payload.target_account_id;
  const periodStart = payload.period_starts_at;
  const periodEnd = payload.period_ends_at;

  // Get price ID from first line item (primary subscription plan)
  const priceId = payload.line_items[0]?.variant_id;

  if (!priceId) {
    console.warn('[Billing] No price ID found in invoice payload');
    return;
  }

  if (!accountId) {
    console.warn('[Billing] No account ID found in invoice payload');
    return;
  }

  // Determine token limit from price ID (uses single source of truth)
  let tokenLimit: number;
  try {
    tokenLimit = getPlanTokenLimit(priceId);
  } catch {
    // Log and use default if price ID not found (shouldn't happen in prod)
    console.warn(
      `[Billing] Unknown price ID: ${priceId}, using default limit`,
    );
    tokenLimit = 1_000_000; // Default fallback (Lite tier)
  }

  // Check if usage period already exists with CORRECT token limit (proper idempotency)
  // If period exists but has wrong limit, we should update it
  const { data: existingPeriod } = await supabase
    .from('usage_periods')
    .select('id, tokens_limit')
    .eq('account_id', accountId)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .maybeSingle();

  if (existingPeriod && existingPeriod.tokens_limit === tokenLimit) {
    console.log('[Billing] Usage period already exists with correct token limit, skipping');
    return;
  }

  if (existingPeriod) {
    console.log('[Billing] Usage period exists but has wrong limit:', {
      existing: existingPeriod.tokens_limit,
      expected: tokenLimit,
      willUpdate: true,
    });
  }

  // Create new usage period (or reset existing)
  const { error: resetError } = (await (supabase.rpc as CallableFunction)(
    'reset_usage_period',
    {
      p_account_id: accountId,
      p_tokens_limit: tokenLimit,
      p_period_start: periodStart,
      p_period_end: periodEnd,
    },
  )) as { error: Error | null };

  if (resetError) {
    throw new Error(`Failed to reset usage period: ${resetError.message}`);
  }

  console.log(
    `[Billing] Reset usage period for account: ${accountId}, tokens: ${tokenLimit}`,
  );
}
