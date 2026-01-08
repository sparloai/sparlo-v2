'use client';

import { useTransition } from 'react';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { useParams } from 'next/navigation';

import { PlanPicker } from '@kit/billing-gateway/components';
import { useAppEvents } from '@kit/shared/events';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import billingConfig from '~/config/billing.config';

import { createTeamAccountCheckoutSession } from '../_lib/server/server-actions';

export function TeamAccountCheckoutForm(params: {
  accountId: string;
  customerId: string | null | undefined;
}) {
  const routeParams = useParams();
  const [pending, startTransition] = useTransition();
  const appEvents = useAppEvents();

  // only allow trial if the user is not already a customer
  const canStartTrial = !params.customerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Trans i18nKey={'billing:manageTeamPlan'} />
        </CardTitle>

        <CardDescription>
          <Trans i18nKey={'billing:manageTeamPlanDescription'} />
        </CardDescription>
      </CardHeader>

      <CardContent>
        <PlanPicker
          pending={pending}
          config={billingConfig}
          canStartTrial={canStartTrial}
          onSubmit={({ planId, productId }) => {
            startTransition(async () => {
              const slug = routeParams.account as string;

              appEvents.emit({
                type: 'checkout.started',
                payload: {
                  planId,
                  account: slug,
                },
              });

              try {
                // Server action redirects to Stripe checkout page
                await createTeamAccountCheckoutSession({
                  planId,
                  productId,
                  slug,
                  accountId: params.accountId,
                });
              } catch (error) {
                // redirect() throws an error, so we need to rethrow it
                if (isRedirectError(error)) {
                  throw error;
                }
                // Handle other errors silently or show toast
              }
            });
          }}
        />
      </CardContent>
    </Card>
  );
}
