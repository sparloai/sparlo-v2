import 'server-only';

import { cache } from 'react';

import { createAccountsApi } from '@kit/accounts/api';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { UsageCheckResponseSchema } from '~/lib/usage/schemas';

/**
 * Load the personal account billing page data for the given user.
 * @param userId
 * @returns The subscription data or the orders data and the billing customer ID.
 * This function is cached per-request.
 */
export const loadPersonalAccountBillingPageData = cache(
  personalAccountBillingPageDataLoader,
);

async function personalAccountBillingPageDataLoader(userId: string) {
  const client = getSupabaseServerClient();
  const api = createAccountsApi(client);

  const [subscription, order, customerId] = await Promise.all([
    api.getSubscription(userId),
    api.getOrder(userId),
    api.getCustomerId(userId),
  ]);

  // Load usage data if user has an active subscription
  let usage = null;
  if (subscription) {
    try {
      const { data, error } = await (client.rpc as CallableFunction)(
        'check_usage_allowed',
        {
          p_account_id: userId,
          p_estimated_tokens: 0,
        },
      );

      if (!error && data) {
        const validated = UsageCheckResponseSchema.safeParse(data);
        if (validated.success) {
          usage = validated.data;
        }
      }
    } catch {
      // Usage data is optional, don't fail the page
    }
  }

  return [subscription, order, customerId, usage] as const;
}
