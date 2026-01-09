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

async function PersonalAccountBillingPage() {
  const user = await requireUserInServerComponent();

  const [subscription, _order, customerId, usage] =
    await loadPersonalAccountBillingPageData(user.id);

  // Debug: Log subscription data to identify why it might not be showing
  console.log('[Billing Page] User:', user.id);
  console.log('[Billing Page] Subscription:', subscription ? {
    id: subscription.id,
    status: subscription.status,
    active: (subscription as { active?: boolean }).active,
    account_id: (subscription as { account_id?: string }).account_id,
  } : null);

  const hasActiveSubscription =
    subscription && subscription.status !== 'canceled';

  // Active subscribers see their subscription management page
  if (hasActiveSubscription) {
    return (
      <SubscriberBillingPage
        usage={usage}
        periodEnd={subscription.period_ends_at}
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
