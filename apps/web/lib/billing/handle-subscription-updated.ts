import 'server-only';

import { UpsertSubscriptionParams } from '@kit/billing/types';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { getPlanTokenLimit } from './plan-limits';

/**
 * Handle customer.subscription.updated webhook from Stripe.
 * Updates the token limit immediately when a user upgrades/downgrades mid-cycle.
 *
 * THROWS on DB failure to trigger webhook retry.
 */
export async function handleSubscriptionUpdated(
  payload: UpsertSubscriptionParams,
): Promise<void> {
  const accountId = payload.target_account_id;
  const priceId = payload.line_items?.[0]?.variant_id;

  // Early validation - not an error, just incomplete data
  if (!accountId || !priceId) {
    console.warn(
      '[Billing] handleSubscriptionUpdated: Missing required fields',
      {
        hasAccountId: !!accountId,
        hasPriceId: !!priceId,
      },
    );
    return;
  }

  // Get token limit - throws if unknown priceId (config error)
  const tokenLimit = getPlanTokenLimit(priceId);

  const supabase = getSupabaseServerAdminClient();

  // Update with .select() to get actual row data
  const { data, error } = await supabase
    .from('usage_periods')
    .update({
      tokens_limit: tokenLimit,
      updated_at: new Date().toISOString(),
    })
    .eq('account_id', accountId)
    .eq('status', 'active')
    .select('id');

  if (error) {
    console.error('[Billing] Failed to update token limit:', {
      error,
      accountId,
      priceId,
    });
    throw new Error(`Failed to update token limit: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // No active period - not an error, invoice.paid will create it
    console.log('[Billing] No active usage period to update (transitioning)', {
      accountId,
    });
    return;
  }

  console.log('[Billing] Token limit updated:', {
    accountId,
    priceId,
    tokenLimit,
  });
}
