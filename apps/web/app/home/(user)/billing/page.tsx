import { redirect } from 'next/navigation';

import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import appConfig from '~/config/app.config';
import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { HomeLayoutPageHeader } from '../_components/home-page-header';
import { AuraPricingHeader } from './_components/aura-pricing-header';
import { AuraPricingTable } from './_components/aura-pricing-table';
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

  const [subscription, _order, customerId] =
    await loadPersonalAccountBillingPageData(user.id);

  const hasActiveSubscription =
    subscription && subscription.status !== 'canceled';

  // SUBSCRIBER: Redirect directly to Stripe Customer Portal
  if (hasActiveSubscription && customerId) {
    const client = getSupabaseServerClient();
    const service = await getBillingGatewayProvider(client);

    const returnUrl = new URL(
      pathsConfig.app.personalAccountBilling,
      appConfig.url,
    ).toString();

    const session = await service.createBillingPortalSession({
      customerId,
      returnUrl,
    });

    redirect(session.url);
  }

  // NON-SUBSCRIBER: Show pricing table
  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.billing'} />}
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className="mx-auto max-w-5xl space-y-8 py-8 md:py-12">
          <AuraPricingHeader
            title="Choose Your Plan"
            subtitle="Get started with Sparlo and unlock powerful AI-driven innovation reports."
          />
          <AuraPricingTable config={billingConfig} customerId={customerId} />
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(PersonalAccountBillingPage);
