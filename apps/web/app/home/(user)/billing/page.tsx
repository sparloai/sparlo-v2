import { redirect } from 'next/navigation';

import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { PageBody } from '@kit/ui/page';

import appConfig from '~/config/app.config';
import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

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

  // NON-SUBSCRIBER: Show Aura pricing page
  return (
    <PageBody>
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center py-20 md:py-32">
        <div className="mx-auto w-full max-w-7xl px-6">
          <AuraPricingHeader title="Plans" />
          <AuraPricingTable config={billingConfig} customerId={customerId} />
        </div>
      </div>
    </PageBody>
  );
}

export default withI18n(PersonalAccountBillingPage);
