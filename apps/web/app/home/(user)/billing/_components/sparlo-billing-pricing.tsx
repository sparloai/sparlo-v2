'use client';

import { useCallback, useState, useTransition } from 'react';

import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Check } from 'lucide-react';

import type { BillingConfig } from '@kit/billing';
import { getPrimaryLineItem } from '@kit/billing';
import { useAppEvents } from '@kit/shared/events';
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
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
          {/* Back link */}
          <button
            onClick={resetCheckout}
            className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600 focus-visible:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none active:text-zinc-700"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to plans
          </button>

          {/* Page title */}
          <h1 className="font-heading mb-12 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            Checkout
          </h1>

          <EmbeddedCheckout
            checkoutToken={checkout.checkoutToken}
            provider={config.provider}
            onClose={resetCheckout}
          />
        </div>
      </main>
    );
  }

  // Get visible products and build tier data
  const visibleProducts = config.products.filter((p) => !p.hidden);

  // Empty state when no products configured
  if (visibleProducts.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-8 pt-24 pb-16">
          <Link
            href="/home"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600 focus-visible:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Dashboard
          </Link>

          <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            Plans
          </h1>

          <div className="mt-16 text-center">
            <p className="text-[18px] tracking-[-0.02em] text-zinc-500">
              No plans available at this time.
            </p>
            <p className="mt-2 text-[15px] tracking-[-0.02em] text-zinc-400">
              Please check back later or contact support.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-8 pt-24 pb-16">
        {/* Back link */}
        <Link
          href="/home"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600 focus-visible:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none active:text-zinc-700"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Dashboard
        </Link>

        {/* Page title */}
        <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          Plans
        </h1>

        {/* Billing Toggle */}
        <div className="mt-10 mb-12 flex items-center gap-6">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'cursor-pointer text-[15px] font-medium tracking-[-0.02em] transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none',
              billingPeriod === 'monthly'
                ? 'text-zinc-900'
                : 'text-zinc-400 hover:text-zinc-600 active:text-zinc-700',
            )}
          >
            Monthly
          </button>

          <button
            onClick={() =>
              setBillingPeriod(
                billingPeriod === 'monthly' ? 'annual' : 'monthly',
              )
            }
            className="relative h-5 w-9 cursor-pointer rounded-full bg-zinc-200 transition-colors hover:bg-zinc-300 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none active:bg-zinc-400"
            aria-label="Toggle billing period"
            role="switch"
            aria-checked={billingPeriod === 'annual'}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-zinc-900 transition-all duration-200',
                billingPeriod === 'annual' ? 'left-[18px]' : 'left-0.5',
              )}
            />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'cursor-pointer text-[15px] font-medium tracking-[-0.02em] transition-colors focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none',
                billingPeriod === 'annual'
                  ? 'text-zinc-900'
                  : 'text-zinc-400 hover:text-zinc-600 active:text-zinc-700',
              )}
            >
              Annual
            </button>
            <span className="text-[12px] font-medium tracking-[-0.02em] text-zinc-500">
              Save ~17%
            </span>
          </div>
        </div>

        {/* Error message */}
        {checkout.error && (
          <div
            className="mb-8 border-l-2 border-zinc-400 bg-zinc-50 py-4 pr-4 pl-6"
            role="alert"
          >
            <p className="text-[14px] tracking-[-0.02em] text-zinc-600">
              {checkout.error}
            </p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="space-y-6">
          {visibleProducts.map((product, index) => {
            // Get monthly and annual plans
            const monthlyPlan = product.plans.find(
              (p) => p.interval === 'month',
            );
            const annualPlan = product.plans.find((p) => p.interval === 'year');
            const activePlan =
              billingPeriod === 'monthly' ? monthlyPlan : annualPlan;

            if (!activePlan) return null;

            const primaryLineItem = getPrimaryLineItem(config, activePlan.id);
            if (!primaryLineItem) return null;

            const price = primaryLineItem.cost / 100;
            const displayPrice =
              billingPeriod === 'annual' ? Math.round(price / 12) : price;
            const isCurrent = currentPlanId === activePlan.id;
            const isPending =
              pending && checkout.selectedPlan === activePlan.id;
            const isHighlighted = index === 1; // Middle plan highlighted

            return (
              <article
                key={product.id}
                className={cn(
                  'overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-200',
                  isHighlighted
                    ? 'border-l-2 border-zinc-200 border-l-zinc-900'
                    : 'border-zinc-200 hover:border-zinc-300',
                )}
              >
                <div className="p-8">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-8">
                    {/* Left: Plan info */}
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                        {product.name}
                      </h2>

                      <p className="mt-2 line-clamp-2 text-[15px] tracking-[-0.02em] text-zinc-500">
                        {product.description}
                      </p>

                      {/* Features */}
                      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                        {product.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <Check
                              className="h-3.5 w-3.5 shrink-0 text-zinc-900"
                              aria-hidden="true"
                            />
                            <span className="text-[14px] tracking-[-0.02em] text-zinc-700">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Right: Price and CTA */}
                    <div className="flex shrink-0 flex-col items-end gap-4">
                      <div className="text-right">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[32px] font-semibold tracking-tight text-zinc-900">
                            ${displayPrice}
                          </span>
                          <span className="text-[15px] tracking-[-0.02em] text-zinc-500">
                            /mo
                          </span>
                        </div>
                        {billingPeriod === 'annual' && (
                          <p className="mt-1 text-[13px] tracking-[-0.02em] text-zinc-400">
                            Billed annually
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          handleSelectPlan(activePlan.id, product.id)
                        }
                        disabled={pending || isCurrent || isPending}
                        className={cn(
                          'px-6 py-2.5 text-[14px] font-medium transition-all duration-150 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none',
                          isCurrent
                            ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                            : isHighlighted
                              ? 'cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950'
                              : 'cursor-pointer border border-zinc-300 text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 active:bg-zinc-50',
                          (pending || isPending) &&
                            'cursor-not-allowed opacity-50',
                        )}
                      >
                        {isPending
                          ? 'Loading...'
                          : isCurrent
                            ? 'Current Plan'
                            : 'Get Started'}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-12 border-l-2 border-zinc-200 pl-6">
          <p className="text-[14px] tracking-[-0.02em] text-zinc-500">
            Need an enterprise agreement?{' '}
            <Link
              href="/contact"
              className="font-medium text-zinc-900 transition-colors hover:text-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none active:text-zinc-700"
            >
              Contact us
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
