import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { PageBody } from '@kit/ui/page';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { HomeLayoutPageHeader } from '../_components/home-page-header';
import { StripePricingTable } from './_components/stripe-pricing-table';

export const metadata = {
  title: 'Billing (Stripe Pricing Table)',
};

async function BillingPage2() {
  const user = await requireUserInServerComponent();

  return (
    <>
      <HomeLayoutPageHeader
        title="Billing - Stripe Pricing Table"
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold">Choose Your Plan</h2>
            <p className="text-muted-foreground mx-auto max-w-lg">
              This page uses Stripe's embedded Pricing Table component for
              comparison.
            </p>
          </div>

          <StripePricingTable userId={user.id} userEmail={user.email ?? ''} />

          <div className="border-t pt-6">
            <p className="text-muted-foreground text-center text-sm">
              All plans include a 14-day money-back guarantee.
            </p>
          </div>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(BillingPage2);
