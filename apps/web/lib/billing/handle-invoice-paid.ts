import 'server-only';

import { z } from 'zod';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import { getPlanTokenLimit } from './plan-limits';

// Schema for webhook input validation
const InvoicePaidInputSchema = z.object({
  eventId: z.string().min(1),
  customerId: z.string().min(1),
  subscriptionId: z.string().min(1),
  priceId: z.string().min(1),
});

/**
 * Handle invoice.paid webhook from Stripe.
 * Creates/resets usage period for the new billing cycle.
 *
 * Includes idempotency checks to handle duplicate webhook deliveries.
 */
export async function handleInvoicePaid(
  eventId: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
): Promise<void> {
  // Validate input
  const input = InvoicePaidInputSchema.parse({
    eventId,
    customerId,
    subscriptionId,
    priceId,
  });

  const supabase = getSupabaseServerAdminClient();

  // IDEMPOTENCY CHECK: Skip if we already processed this event
  // Note: check_webhook_processed function added by migration 20251220231233
  // After migration, regenerate types with: pnpm supabase:web:typegen
  const { data: alreadyProcessed, error: checkError } = (await (
    supabase.rpc as CallableFunction
  )('check_webhook_processed', { p_event_id: input.eventId })) as {
    data: boolean | null;
    error: Error | null;
  };

  if (checkError) {
    throw new Error(
      `Failed to check webhook idempotency: ${checkError.message}`,
    );
  }

  if (alreadyProcessed) {
    console.log('[Billing] Already processed event:', input.eventId);
    return;
  }

  // Get account from billing customer
  const { data: billingCustomer, error: customerError } = await supabase
    .from('billing_customers')
    .select('account_id')
    .eq('customer_id', input.customerId)
    .single();

  if (customerError || !billingCustomer) {
    throw new Error(`No billing customer found for ${input.customerId}`);
  }

  const accountId = billingCustomer.account_id;

  // Determine token limit from price ID (uses single source of truth)
  let tokenLimit: number;
  try {
    tokenLimit = getPlanTokenLimit(input.priceId);
  } catch {
    // Log and use default if price ID not found (shouldn't happen in prod)
    console.warn(
      `[Billing] Unknown price ID: ${input.priceId}, using default limit`,
    );
    tokenLimit = 3_000_000; // Starter tier default
  }

  // Get subscription period dates
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('period_starts_at, period_ends_at')
    .eq('id', input.subscriptionId)
    .single();

  if (subError || !subscription) {
    throw new Error(`No subscription found for ${input.subscriptionId}`);
  }

  // IDEMPOTENCY CHECK: Skip if usage period already exists for this billing cycle
  const { data: existingPeriod } = await supabase
    .from('usage_periods')
    .select('id')
    .eq('account_id', accountId)
    .eq('period_start', subscription.period_starts_at)
    .eq('period_end', subscription.period_ends_at)
    .maybeSingle();

  if (existingPeriod) {
    console.log('[Billing] Usage period already exists for this billing cycle');
  } else {
    // Create new usage period (or reset existing)
    // Note: reset_usage_period function added by migration 20251220231233
    const { error: resetError } = (await (supabase.rpc as CallableFunction)(
      'reset_usage_period',
      {
        p_account_id: accountId,
        p_tokens_limit: tokenLimit,
        p_period_start: subscription.period_starts_at,
        p_period_end: subscription.period_ends_at,
      },
    )) as { error: Error | null };

    if (resetError) {
      throw new Error(`Failed to reset usage period: ${resetError.message}`);
    }

    console.log('[Billing] Reset usage period for account:', accountId);
  }

  // Mark event as processed (idempotency)
  // Note: mark_webhook_processed function added by migration 20251220231233
  const { error: markError } = (await (supabase.rpc as CallableFunction)(
    'mark_webhook_processed',
    {
      p_event_id: input.eventId,
      p_event_type: 'invoice.paid',
    },
  )) as { error: Error | null };

  if (markError) {
    // Log but don't fail - the main work is done
    console.error('[Billing] Failed to mark event as processed:', markError);
  }
}
