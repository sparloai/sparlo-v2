'use client';

import { useCallback, useState, useTransition } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { ArrowLeft, Check } from 'lucide-react';

import type { BillingConfig } from '@kit/billing';
import { getPrimaryLineItem } from '@kit/billing';
import { useAppEvents } from '@kit/shared/events';
import { Alert, AlertDescription } from '@kit/ui/alert';
import { cn } from '@kit/ui/utils';

import { createPersonalAccountCheckoutSession } from '../_lib/server/server-actions';

const EmbeddedCheckout = dynamic(
  async () => {
    const { EmbeddedCheckout } = await import('@kit/billing-gateway/checkout');
    return { default: EmbeddedCheckout };
  },
  { ssr: false },
);

interface SparloBillingPricingProps {
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

export function SparloBillingPricing({
  config,
  customerId: _customerId,
  currentPlanId,
}: SparloBillingPricingProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>(
    'monthly',
  );
  const [pending, startTransition] = useTransition();
  const [checkout, setCheckout] = useState<CheckoutState>(initialCheckoutState);
  const appEvents = useAppEvents();

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

  // Show embedded checkout when token is available
  if (checkout.checkoutToken) {
    return (
      <div className="mx-auto max-w-2xl pt-8 pb-20 md:pt-12 md:pb-32">
        <button
          onClick={resetCheckout}
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-950 dark:hover:text-white"
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

  // Get visible products and build tier data
  const visibleProducts = config.products.filter((p) => !p.hidden);

  return (
    <main className="flex flex-grow flex-col items-center justify-center pt-8 pb-20 md:pt-12 md:pb-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-12 max-w-2xl">
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl dark:text-white">
            Plans
          </h1>
          <p className="text-lg leading-relaxed font-normal text-zinc-500 dark:text-zinc-400">
            Engineering intelligence for professional teams.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mb-12 flex items-center justify-start gap-4">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`text-sm font-medium transition-colors ${
              billingPeriod === 'monthly'
                ? 'text-zinc-950 dark:text-white'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() =>
              setBillingPeriod(
                billingPeriod === 'monthly' ? 'annual' : 'monthly',
              )
            }
            className="relative h-6 w-11 rounded-full bg-zinc-200 transition-colors dark:bg-zinc-700"
            aria-label="Toggle billing period"
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-zinc-950 transition-transform dark:bg-white ${
                billingPeriod === 'annual' ? 'left-6' : 'left-1'
              }`}
            />
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`text-sm font-medium transition-colors ${
              billingPeriod === 'annual'
                ? 'text-zinc-950 dark:text-white'
                : 'text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300'
            }`}
          >
            Annual
            <span className="ml-2 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              2 months free
            </span>
          </button>
        </div>

        {/* Error Alert */}
        {checkout.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{checkout.error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3 lg:gap-12">
          {visibleProducts.map((product, index) => {
            // Get monthly and annual plans
            const monthlyPlan = product.plans.find(
              (p) => p.interval === 'month',
            );
            const annualPlan = product.plans.find(
              (p) => p.interval === 'year',
            );
            const activePlan =
              billingPeriod === 'monthly' ? monthlyPlan : annualPlan;

            if (!activePlan) return null;

            const primaryLineItem = getPrimaryLineItem(config, activePlan.id);
            if (!primaryLineItem) return null;

            const price = primaryLineItem.cost / 100;
            const displayPrice =
              billingPeriod === 'annual' ? Math.round(price / 12) : price;
            const isCurrent = currentPlanId === activePlan.id;
            const isPending = pending && checkout.selectedPlan === activePlan.id;
            const isHighlighted = index === 1; // Middle plan highlighted

            return (
              <div
                key={product.id}
                className={cn(
                  'group relative flex flex-col rounded-lg border p-8 transition-colors duration-300 md:p-10',
                  isHighlighted
                    ? 'border-primary/50 bg-white dark:border-primary/30 dark:bg-zinc-900'
                    : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700',
                )}
              >
                <div className="mb-8">
                  <h3 className="mb-1 text-xs font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                    {product.name}
                  </h3>
                  <p className="mb-6 text-sm text-zinc-400 dark:text-zinc-500">
                    {product.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
                      ${displayPrice}
                    </span>
                    <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
                      /month
                    </span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      Billed annually
                    </p>
                  )}
                </div>

                <div className="mb-10 flex-grow space-y-4 border-t border-zinc-100 pt-8 dark:border-zinc-800">
                  {product.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      <span className="text-base font-normal text-zinc-700 dark:text-zinc-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleSelectPlan(activePlan.id, product.id)}
                  disabled={pending || isCurrent || isPending}
                  className={cn(
                    'block w-full rounded px-4 py-3 text-center text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    isCurrent
                      ? 'cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500'
                      : isHighlighted
                        ? 'bg-primary hover:bg-primary/90 focus-visible:ring-primary text-white'
                        : 'bg-primary/20 text-primary hover:bg-primary/30 focus-visible:ring-primary dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30',
                    (pending || isPending) && 'cursor-not-allowed opacity-50',
                  )}
                >
                  {isPending
                    ? 'Loading...'
                    : isCurrent
                      ? 'Current Plan'
                      : 'Get started'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Enterprise Callout */}
        <div className="mt-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Need an enterprise agreement?{' '}
            <Link
              href="/contact"
              className="font-medium text-zinc-950 decoration-zinc-300 underline-offset-4 hover:underline dark:text-white dark:decoration-zinc-600"
            >
              Contact us
            </Link>
          </p>
          <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-500">
            Cancel anytime.
          </p>
        </div>
      </div>
    </main>
  );
}
