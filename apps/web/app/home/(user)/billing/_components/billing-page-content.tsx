'use client';

import { useRef } from 'react';

import type { BillingConfig } from '@kit/billing';

import type { UsageCheckResponse } from '~/lib/usage/schemas';

import { createPersonalAccountBillingPortalSession } from '../_lib/server/server-actions';
import { CurrentPlanCard } from './current-plan-card';
import { PricingTable } from './pricing-table';
import { UsageCard } from './usage-card';

interface Subscription {
  id: string;
  status: string;
  period_ends_at: string;
  items: Array<{ variant_id: string }>;
}

interface Order {
  id: string;
  items: Array<{ variant_id: string }>;
}

interface ProductPlan {
  product: {
    id: string;
    name: string;
    description: string;
    features: string[];
  };
  plan: {
    id: string;
    interval?: string;
  };
}

interface BillingPageContentProps {
  subscription: Subscription | null;
  order: Order | null;
  customerId: string | null | undefined;
  usage: UsageCheckResponse | null;
  billingConfig: BillingConfig;
  productPlan?: ProductPlan;
  currentPlanPrice: number;
}

export function BillingPageContent({
  subscription,
  order,
  customerId,
  usage,
  billingConfig,
  productPlan,
  currentPlanPrice,
}: BillingPageContentProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleManageSubscription = () => {
    formRef.current?.requestSubmit();
  };

  const hasActiveSubscription =
    subscription && subscription.status !== 'canceled';

  // Show pricing table for non-subscribers
  if (!subscription && !order) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">Choose Your Plan</h2>
          <p className="text-muted-foreground mx-auto max-w-lg">
            Get started with Sparlo and unlock powerful AI-driven financial
            analysis for your business.
          </p>
        </div>
        <PricingTable config={billingConfig} customerId={customerId} />
      </div>
    );
  }

  // Show subscription management for subscribers
  return (
    <div className="space-y-8">
      {/* Hidden form for billing portal session */}
      <form
        ref={formRef}
        action={createPersonalAccountBillingPortalSession}
        className="hidden"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Plan */}
        {productPlan && (
          <CurrentPlanCard
            planName={productPlan.product.name}
            planDescription={productPlan.product.description}
            price={currentPlanPrice}
            interval={productPlan.plan.interval ?? 'month'}
            status={subscription?.status ?? 'active'}
            features={productPlan.product.features}
            onManageSubscription={handleManageSubscription}
          />
        )}

        {/* Usage Stats */}
        {usage && hasActiveSubscription && (
          <UsageCard
            tokensUsed={usage.tokens_used}
            tokensLimit={usage.tokens_limit}
            reportsCount={usage.reports_count}
            chatTokensUsed={usage.chat_tokens_used}
            periodEnd={subscription?.period_ends_at ?? null}
            planName={productPlan?.product.name ?? 'Standard'}
          />
        )}
      </div>

      {/* Upgrade Options */}
      {hasActiveSubscription && (
        <div className="space-y-4">
          <div className="border-t pt-8">
            <h3 className="mb-2 text-lg font-semibold">Upgrade Your Plan</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Need more capacity? Upgrade to unlock additional reports and
              features.
            </p>
            <PricingTable
              config={billingConfig}
              customerId={customerId}
              currentPlanId={productPlan?.plan.id}
            />
          </div>
        </div>
      )}
    </div>
  );
}
