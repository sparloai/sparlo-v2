'use client';

import { useState, useTransition } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Check, Sparkles, Zap } from 'lucide-react';

import type { BillingConfig } from '@kit/billing';
import { getPrimaryLineItem } from '@kit/billing';
import { useAppEvents } from '@kit/shared/events';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { createPersonalAccountCheckoutSession } from '../_lib/server/server-actions';

const EmbeddedCheckout = dynamic(
  async () => {
    const { EmbeddedCheckout } = await import('@kit/billing-gateway/checkout');
    return { default: EmbeddedCheckout };
  },
  { ssr: false },
);

interface PricingTableProps {
  config: BillingConfig;
  customerId: string | null | undefined;
  currentPlanId?: string;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  standard: <Zap className="h-5 w-5" />,
  pro: <Sparkles className="h-5 w-5" />,
  max: <Sparkles className="h-5 w-5" />,
};

export function PricingTable({
  config,
  customerId,
  currentPlanId,
}: PricingTableProps) {
  const [pending, startTransition] = useTransition();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutToken, setCheckoutToken] = useState<string | undefined>();
  const appEvents = useAppEvents();

  const visibleProducts = config.products.filter((p) => !p.hidden);
  const canStartTrial = !customerId;

  if (checkoutToken) {
    return (
      <EmbeddedCheckout
        checkoutToken={checkoutToken}
        provider={config.provider}
        onClose={() => setCheckoutToken(undefined)}
      />
    );
  }

  const handleSelectPlan = (planId: string, productId: string) => {
    setSelectedPlan(planId);
    startTransition(async () => {
      try {
        appEvents.emit({ type: 'checkout.started', payload: { planId } });
        const { checkoutToken } = await createPersonalAccountCheckoutSession({
          planId,
          productId,
        });
        setCheckoutToken(checkoutToken);
      } catch {
        setSelectedPlan(null);
      }
    });
  };

  return (
    <div className="w-full">
      <div className="grid gap-6 md:grid-cols-3">
        {visibleProducts.map((product) => {
          const plan = product.plans[0];
          if (!plan) return null;

          const primaryLineItem = getPrimaryLineItem(config, plan.id);
          if (!primaryLineItem) return null;

          const price = primaryLineItem.cost / 100;
          const isHighlighted = product.highlighted;
          const isCurrentPlan = currentPlanId === plan.id;
          const isPending = pending && selectedPlan === plan.id;

          return (
            <div
              key={product.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-all duration-200',
                isHighlighted
                  ? 'border-primary bg-primary/[0.02] ring-primary/20 shadow-lg ring-1'
                  : 'border-border hover:border-primary/50',
                isCurrentPlan && 'ring-2 ring-green-500/50',
              )}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-medium">
                    Most Popular
                  </Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge
                    variant="success"
                    className="bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600"
                  >
                    Current Plan
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      isHighlighted
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {PLAN_ICONS[product.id] ?? <Zap className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    {product.badge && (
                      <span className="text-muted-foreground text-xs">
                        {product.badge}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  {product.description}
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">
                    ${price}
                  </span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        isHighlighted ? 'text-primary' : 'text-green-500',
                      )}
                    />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <Button variant="outline" disabled className="w-full">
                  Current Plan
                </Button>
              ) : (
                <Button
                  className={cn(
                    'w-full',
                    isHighlighted
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-foreground text-background hover:bg-foreground/90',
                  )}
                  onClick={() => handleSelectPlan(plan.id, product.id)}
                  disabled={pending}
                >
                  {isPending
                    ? 'Loading...'
                    : canStartTrial && plan.trialDays
                      ? `Start ${plan.trialDays}-day trial`
                      : currentPlanId
                        ? 'Upgrade'
                        : 'Get Started'}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-muted-foreground mt-8 text-center text-sm">
        All plans include a 14-day money-back guarantee.{' '}
        <Link href="/contact" className="text-primary hover:underline">
          Contact us
        </Link>{' '}
        for enterprise pricing.
      </p>
    </div>
  );
}
