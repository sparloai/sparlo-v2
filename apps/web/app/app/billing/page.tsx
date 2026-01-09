import billingConfig from '~/config/billing.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { SparloBillingPricing } from './_components/sparlo-billing-pricing';
import { SubscriberBillingPage } from './_components/subscriber-billing-page';
import { loadPersonalAccountBillingPageData } from './_lib/server/personal-account-billing-page.loader';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:billingTab');

  return {
    title,
  };
};

// Get plan info from price ID
function getPlanInfo(priceId: string | undefined) {
  if (!priceId) return { name: 'Unknown', interval: 'month' as const };

  for (const product of billingConfig.products) {
    for (const plan of product.plans) {
      const lineItem = plan.lineItems.find((item) => item.id === priceId);
      if (lineItem) {
        return {
          name: product.name,
          interval: plan.interval as 'month' | 'year',
        };
      }
    }
  }

  return { name: 'Unknown', interval: 'month' as const };
}

async function PersonalAccountBillingPage() {
  const user = await requireUserInServerComponent();

  const [subscription, _order, customerId, usage] =
    await loadPersonalAccountBillingPageData(user.id);

  const hasActiveSubscription =
    subscription && subscription.status !== 'canceled';

  // Active subscribers see their subscription management page
  if (hasActiveSubscription) {
    // Get price ID from subscription items
    const priceId = subscription.items?.[0]?.variant_id;
    const planInfo = getPlanInfo(priceId);
    // Can upgrade if not on Max plan
    const canUpgrade = planInfo.name !== 'Max';

    return (
      <SubscriberBillingPage
        usage={usage}
        periodEnd={subscription.period_ends_at}
        planName={planInfo.name}
        planInterval={planInfo.interval}
        canUpgrade={canUpgrade}
      />
    );
  }

  // Non-subscribers see the pricing/plans page
  return (
    <SparloBillingPricing
      config={billingConfig}
      customerId={customerId}
    />
  );
}

export default withI18n(PersonalAccountBillingPage);
