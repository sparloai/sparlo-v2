'use client';

import { useRef } from 'react';

import type { BillingConfig } from '@kit/billing';

import type { UsageCheckResponse } from '~/lib/usage/schemas';

import { createPersonalAccountBillingPortalSession } from '../_lib/server/server-actions';
import { AuraCurrentPlanCard } from './aura-current-plan-card';
import { AuraPricingHeader } from './aura-pricing-header';
import { AuraPricingTable } from './aura-pricing-table';
import { AuraUsageCard } from './aura-usage-card';

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

  // NEW SUBSCRIBER: Show Aura-styled pricing
  if (!subscription && !order) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-8 md:py-12">
        <AuraPricingHeader
          title="Choose Your Plan"
          subtitle="Get started with Sparlo and unlock powerful AI-driven financial analysis for your business."
        />
        <AuraPricingTable config={billingConfig} customerId={customerId} />
      </div>
    );
  }

  // ACTIVE SUBSCRIBER: Show current plan + usage
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-8 md:py-12">
      {/* Hidden form for billing portal session */}
      <form
        ref={formRef}
        action={createPersonalAccountBillingPortalSession}
        className="hidden"
      />

      <AuraPricingHeader
        title="Your Subscription"
        subtitle="Manage your plan, view usage, and update billing settings."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Plan Card */}
        {productPlan && (
          <AuraCurrentPlanCard
            planName={productPlan.product.name}
            price={currentPlanPrice}
            interval={productPlan.plan.interval ?? 'month'}
            status={subscription?.status ?? 'active'}
            periodEnd={subscription?.period_ends_at ?? ''}
            features={productPlan.product.features}
            onManageSubscription={handleManageSubscription}
          />
        )}

        {/* Usage Stats Card */}
        {usage && hasActiveSubscription && (
          <AuraUsageCard
            tokensUsed={usage.tokens_used}
            tokensLimit={usage.tokens_limit}
            reportsCount={usage.reports_count}
            chatTokensUsed={usage.chat_tokens_used}
            periodEnd={subscription?.period_ends_at ?? null}
            planName={productPlan?.product.name ?? 'Standard'}
          />
        )}
      </div>

      {/* Upgrade Section */}
      {hasActiveSubscription && (
        <div className="pt-8">
          <AuraPricingHeader
            title="Upgrade Your Plan"
            subtitle="Need more capacity? Compare plans and upgrade instantly."
          />
          <AuraPricingTable
            config={billingConfig}
            customerId={customerId}
            currentPlanId={productPlan?.plan.id}
          />
        </div>
      )}
    </div>
  );
}
