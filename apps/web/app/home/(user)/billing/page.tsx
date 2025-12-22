import { getPrimaryLineItem } from '@kit/billing';
import { resolveProductPlan } from '@kit/billing-gateway';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { If } from '@kit/ui/if';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import billingConfig from '~/config/billing.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { HomeLayoutPageHeader } from '../_components/home-page-header';
import { BillingPageContent } from './_components/billing-page-content';
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

  const [subscription, order, customerId, usage] =
    await loadPersonalAccountBillingPageData(user.id);

  const subscriptionVariantId = subscription?.items[0]?.variant_id;

  const subscriptionProductPlan =
    subscription && subscriptionVariantId
      ? await resolveProductPlan(
          billingConfig,
          subscriptionVariantId,
          subscription.currency,
        )
      : undefined;

  // Get the current plan's price
  let currentPlanPrice = 0;
  if (subscriptionProductPlan?.plan) {
    const lineItem = getPrimaryLineItem(
      billingConfig,
      subscriptionProductPlan.plan.id,
    );
    if (lineItem) {
      currentPlanPrice = lineItem.cost / 100;
    }
  }

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.billing'} />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <BillingPageContent
          subscription={subscription}
          order={order}
          customerId={customerId}
          usage={usage}
          billingConfig={billingConfig}
          productPlan={subscriptionProductPlan}
          currentPlanPrice={currentPlanPrice}
        />
      </PageBody>
    </>
  );
}

export default withI18n(PersonalAccountBillingPage);
