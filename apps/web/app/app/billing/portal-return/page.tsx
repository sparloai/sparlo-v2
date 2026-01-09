import { redirect } from 'next/navigation';

import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { getPlanTokenLimit } from '~/lib/billing/plan-limits';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

/**
 * Portal Return Page
 *
 * When users return from Stripe Customer Portal, this page:
 * 1. Fetches their current subscription directly from Stripe
 * 2. Syncs it to the database (bypassing webhook delay)
 * 3. Updates usage period if plan changed
 * 4. Redirects to billing page with success message
 */
export default async function PortalReturnPage() {
  const user = await requireUserInServerComponent();

  try {
    await syncSubscriptionFromStripe(user.id);
  } catch (error) {
    console.error('[Portal Return] Failed to sync subscription:', error);
    // Still redirect to billing - webhook will eventually sync
  }

  // Redirect to billing page with success indicator
  redirect('/app/billing?updated=true');
}

async function syncSubscriptionFromStripe(userId: string) {
  const client = getSupabaseServerClient();
  const adminClient = getSupabaseServerAdminClient();

  // Get gateway provider
  const gateway = await getBillingGatewayProvider(client);

  // Get customer ID from our database
  const { data: customer } = await adminClient
    .from('billing_customers')
    .select('customer_id')
    .eq('account_id', userId)
    .maybeSingle();

  if (!customer?.customer_id) {
    console.log('[Portal Return] No customer ID found for user:', userId);
    return;
  }

  // Get existing subscription ID from our database
  const { data: existingSub } = await adminClient
    .from('subscriptions')
    .select('id')
    .eq('account_id', userId)
    .maybeSingle();

  if (!existingSub?.id) {
    console.log('[Portal Return] No subscription found for user:', userId);
    return;
  }

  // Fetch fresh subscription data from Stripe
  console.log('[Portal Return] Fetching subscription from Stripe:', existingSub.id);

  let subscriptionData;
  try {
    subscriptionData = await gateway.getSubscription(existingSub.id);
  } catch (error) {
    console.error('[Portal Return] Failed to fetch subscription from Stripe:', error);
    return;
  }

  if (!subscriptionData) {
    console.log('[Portal Return] Subscription not found in Stripe');
    return;
  }

  // Sync subscription to database
  console.log('[Portal Return] Syncing subscription:', {
    id: subscriptionData.target_subscription_id,
    status: subscriptionData.status,
  });

  const { error: upsertError } = await adminClient.rpc('upsert_subscription', {
    ...subscriptionData,
    target_account_id: userId,
    target_customer_id: customer.customer_id,
  });

  if (upsertError) {
    console.error('[Portal Return] Failed to upsert subscription:', upsertError);
    return;
  }

  // Update usage period with new plan limits
  const priceId = subscriptionData.line_items?.[0]?.variant_id;

  if (priceId && subscriptionData.period_starts_at && subscriptionData.period_ends_at) {
    try {
      const tokenLimit = getPlanTokenLimit(priceId);

      console.log('[Portal Return] Updating usage period:', {
        priceId,
        tokenLimit,
      });

      const { error: usageError } = await adminClient.rpc('reset_usage_period', {
        p_account_id: userId,
        p_tokens_limit: tokenLimit,
        p_period_start: subscriptionData.period_starts_at,
        p_period_end: subscriptionData.period_ends_at,
      });

      if (usageError) {
        console.error('[Portal Return] Failed to update usage period:', usageError);
      } else {
        console.log('[Portal Return] Usage period updated successfully');
      }
    } catch (error) {
      console.error('[Portal Return] Error updating usage period:', error);
    }
  }

  console.log('[Portal Return] Subscription sync complete');
}
