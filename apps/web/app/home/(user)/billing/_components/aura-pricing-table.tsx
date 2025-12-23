'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { AlertCircle, ArrowLeft } from 'lucide-react';

import type { BillingConfig } from '@kit/billing';
import { getPrimaryLineItem } from '@kit/billing';
import { useAppEvents } from '@kit/shared/events';
import { Alert, AlertDescription } from '@kit/ui/alert';

import { createPersonalAccountCheckoutSession } from '../_lib/server/server-actions';
import { AuraPlanCard } from './aura-plan-card';

const EmbeddedCheckout = dynamic(
  async () => {
    const { EmbeddedCheckout } = await import('@kit/billing-gateway/checkout');
    return { default: EmbeddedCheckout };
  },
  { ssr: false },
);

interface AuraPricingTableProps {
  config: BillingConfig;
  customerId: string | null | undefined;
  currentPlanId?: string;
}

interface CheckoutState {
  selectedPlan: string | null;
  checkoutToken: string | undefined;
  error: string | null;
}

const initialCheckoutState: CheckoutState = {
  selectedPlan: null,
  checkoutToken: undefined,
  error: null,
};

export function AuraPricingTable({
  config,
  customerId: _customerId,
  currentPlanId,
}: AuraPricingTableProps) {
  const [pending, startTransition] = useTransition();
  const [checkout, setCheckout] = useState<CheckoutState>(initialCheckoutState);
  const appEvents = useAppEvents();

  const visibleProducts = useMemo(
    () => config.products.filter((p) => !p.hidden),
    [config.products],
  );

  const handleSelectPlan = useCallback(
    (planId: string, productId: string) => {
      setCheckout((prev) => ({ ...prev, selectedPlan: planId, error: null }));
      startTransition(async () => {
        try {
          appEvents.emit({ type: 'checkout.started', payload: { planId } });
          const { checkoutToken } = await createPersonalAccountCheckoutSession({
            planId,
            productId,
          });
          setCheckout((prev) => ({ ...prev, checkoutToken }));
        } catch {
          setCheckout((prev) => ({
            ...prev,
            selectedPlan: null,
            error:
              'Failed to start checkout. Please try again or contact support.',
          }));
        }
      });
    },
    [appEvents],
  );

  const resetCheckout = useCallback(() => {
    setCheckout(initialCheckoutState);
  }, []);

  if (checkout.checkoutToken) {
    return (
      <div className="mx-auto max-w-2xl">
        <button
          onClick={resetCheckout}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to plans
        </button>
        <EmbeddedCheckout
          checkoutToken={checkout.checkoutToken}
          provider={config.provider}
          onClose={resetCheckout}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {checkout.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{checkout.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {visibleProducts.map((product) => {
          const plan = product.plans[0];
          if (!plan) return null;

          const primaryLineItem = getPrimaryLineItem(config, plan.id);
          if (!primaryLineItem) return null;

          const price = primaryLineItem.cost / 100;
          const isHighlighted = product.highlighted;
          const isCurrent = currentPlanId === plan.id;
          const isPending = pending && checkout.selectedPlan === plan.id;

          return (
            <AuraPlanCard
              key={product.id}
              name={product.name}
              price={price}
              interval={plan.interval ?? 'month'}
              description={product.description}
              features={product.features}
              isPopular={isHighlighted}
              isCurrent={isCurrent}
              onSelect={() => handleSelectPlan(plan.id, product.id)}
              disabled={pending}
              isLoading={isPending}
            />
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-zinc-500">
          Need an enterprise agreement?{' '}
          <Link
            href="/contact"
            className="font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 hover:underline"
          >
            Contact us
          </Link>
        </p>
        <p className="mt-4 text-xs text-zinc-400">Cancel anytime.</p>
      </div>
    </div>
  );
}
