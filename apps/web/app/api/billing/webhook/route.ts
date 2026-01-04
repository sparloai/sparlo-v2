import { analytics } from '@kit/analytics/server';
import { getPlanTypesMap } from '@kit/billing';
import { getBillingEventHandlerService } from '@kit/billing-gateway';
import { UpsertSubscriptionParams } from '@kit/billing/types';
import { enhanceRouteHandler } from '@kit/next/routes';
import { getLogger } from '@kit/shared/logger';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import billingConfig from '~/config/billing.config';

/**
 * Track subscription activation for analytics (fire-and-forget)
 */
function trackSubscriptionActivated(subscription: UpsertSubscriptionParams) {
  const lineItem = subscription.line_items?.[0];
  const billingCycle = lineItem?.interval === 'year' ? 'yearly' : 'monthly';

  analytics
    .trackEvent('subscription_activated', {
      plan_id: lineItem?.variant_id ?? 'unknown',
      billing_cycle: billingCycle,
      user_id: subscription.target_account_id,
    })
    .catch((error) => {
      console.error(
        '[Analytics] Failed to track subscription_activated:',
        error,
      );
    });
}

/**
 * @description Handle the webhooks from Stripe related to checkouts
 */
export const POST = enhanceRouteHandler(
  async ({ request }) => {
    const provider = billingConfig.provider;
    const logger = await getLogger();

    const ctx = {
      name: 'billing.webhook',
      provider,
    };

    logger.info(ctx, `Received billing webhook. Processing...`);

    const supabaseClientProvider = () => getSupabaseServerAdminClient();

    const service = await getBillingEventHandlerService(
      supabaseClientProvider,
      provider,
      getPlanTypesMap(billingConfig),
    );

    try {
      await service.handleWebhookEvent(request, {
        // Track new subscriptions for analytics
        onCheckoutSessionCompleted: async (payload) => {
          // Only track subscription activations, not one-time orders
          if (!('target_order_id' in payload)) {
            trackSubscriptionActivated(payload as UpsertSubscriptionParams);
          }
        },
      });

      logger.info(ctx, `Successfully processed billing webhook`);

      return new Response('OK', { status: 200 });
    } catch (error) {
      logger.error({ ...ctx, error }, `Failed to process billing webhook`);

      return new Response('Failed to process billing webhook', {
        status: 500,
      });
    }
  },
  {
    auth: false,
  },
);
