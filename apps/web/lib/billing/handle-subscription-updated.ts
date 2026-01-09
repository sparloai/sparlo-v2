import 'server-only';

import { UpsertSubscriptionParams } from '@kit/billing/types';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { getPlanTokenLimit } from './plan-limits';

/**
 * Handle customer.subscription.updated webhook from Stripe.
 * Updates the token limit immediately when a user upgrades/downgrades mid-cycle.
 *
 * Key behaviors:
 * - Only updates tokens_limit (preserves usage counters)
 * - Does NOT change billing period dates
 * - Safe to call multiple times (idempotent - just sets the limit)
 */
export async function handleSubscriptionUpdated(
  payload: UpsertSubscriptionParams,
): Promise<void> {
  const accountId = payload.target_account_id;
  const firstLineItem = payload.line_items?.[0];
  const priceId = firstLineItem?.variant_id;

  if (!accountId) {
    console.warn('[Billing] handleSubscriptionUpdated: Missing accountId');
    return;
  }

  if (!priceId) {
    console.warn('[Billing] handleSubscriptionUpdated: Missing priceId', {
      accountId,
      lineItemsCount: payload.line_items?.length ?? 0,
    });
    return;
  }

  // Get the token limit for the new plan
  let tokenLimit: number;
  try {
    tokenLimit = getPlanTokenLimit(priceId);
  } catch (err) {
    // Unknown priceId - this is a configuration error, not a user error
    console.error('[Billing] handleSubscriptionUpdated: Unknown priceId', {
      priceId,
      accountId,
      error: err instanceof Error ? err.message : String(err),
    });
    return;
  }

  const supabase = getSupabaseServerAdminClient();

  console.log('[Billing] Updating token limit for subscription change:', {
    accountId,
    priceId,
    newTokenLimit: tokenLimit,
  });

  // Update only the token limit - preserve all usage counters and period dates
  const { error, count } = await supabase
    .from('usage_periods')
    .update({
      tokens_limit: tokenLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', accountId)
    .eq('status', 'active');

  if (error) {
    console.error('[Billing] Failed to update token limit:', {
      error,
      accountId,
      priceId,
      tokenLimit,
    });
    // Don't throw - we don't want to fail the webhook for this
    // The user will get the updated limit on next invoice.paid if this fails
    return;
  }

  if (count === 0) {
    // No active usage period found - this can happen if:
    // 1. User just subscribed and invoice.paid hasn't fired yet
    // 2. User is between billing cycles
    // This is not an error - invoice.paid will create the period with correct limit
    console.log('[Billing] No active usage period to update (may be transitioning)', {
      accountId,
      priceId,
      tokenLimit,
    });
    return;
  }

  console.log('[Billing] Token limit updated successfully:', {
    accountId,
    priceId,
    tokenLimit,
  });
}
