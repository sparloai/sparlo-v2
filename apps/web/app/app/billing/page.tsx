import { getProductPlanPair } from '@kit/billing';

import billingConfig from '~/config/billing.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { SparloBillingPricing } from './_components/sparlo-billing-pricing';
import { loadPersonalAccountBillingPageData } from './_lib/server/personal-account-billing-page.loader';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:billingTab');

  return {
    title,
  };
};

async function PersonalAccountBillingPage() {
  const user = await requireUserInServerComponent();

  const [subscription, _order, customerId, _usage] =
    await loadPersonalAccountBillingPageData(user.id);

  const hasActiveSubscription =
    subscription && subscription.status !== 'canceled';

  // Get current plan ID if subscriber
  let currentPlanId: string | undefined;
  if (hasActiveSubscription && subscription?.items?.[0]?.variant_id) {
    const variantId = subscription.items[0].variant_id;
    try {
      const { plan } = getProductPlanPair(billingConfig, variantId);
      currentPlanId = plan.id;
    } catch {
      // Plan not found in config, ignore
    }
  }

  // Show pricing page for everyone - subscribers see their current plan highlighted
  return (
    <SparloBillingPricing
      config={billingConfig}
      customerId={customerId}
      currentPlanId={currentPlanId}
    />
  );
}

export default withI18n(PersonalAccountBillingPage);
