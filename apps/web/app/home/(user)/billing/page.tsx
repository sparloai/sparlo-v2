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

  const hasActiveSubscription =
    subscription && subscription.status !== 'canceled';

  // SUBSCRIBER: Show usage + manage billing
  if (hasActiveSubscription && customerId) {
    return (
      <SubscriberBillingPage
        usage={usage}
        periodEnd={subscription.period_ends_at}
      />
    );
  }

  // NON-SUBSCRIBER: Show Sparlo pricing page
  return (
    <SparloBillingPricing config={billingConfig} customerId={customerId} />
  );
}

export default withI18n(PersonalAccountBillingPage);
