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

// Extract key metrics from features
function extractMetrics(features: string[]) {
  let problemsPerMonth = '';
  let seats = 1;

  for (const feature of features) {
    // Extract problems/month (e.g., "~3 problems/month")
    const problemsMatch = feature.match(/~?(\d+)\s*problems?\/month/i);
    if (problemsMatch) {
      problemsPerMonth = `~${problemsMatch[1]}`;
    }

    // Extract seats (e.g., "5 team seats" or "1 seat")
    const seatsMatch = feature.match(/(\d+)\s*(?:team\s+)?seats?/i);
    if (seatsMatch?.[1]) {
      seats = parseInt(seatsMatch[1], 10);
    }
  }

  return { problemsPerMonth, seats };
}

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

  // Get visible products
  const visibleProducts = config.products.filter((p) => !p.hidden);

  // Empty state when no products configured
  if (visibleProducts.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-8 pt-24 pb-16">
          <div className="text-center">
            <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900 mb-4">
              Choose your plan
            </h1>
            <p className="text-[18px] text-zinc-500">
              No plans available at this time.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-8 pt-16 pb-24">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-[42px] font-normal tracking-[-0.02em] text-zinc-900 mb-4">
            Choose your plan
          </h1>
          <p className="text-[18px] text-zinc-500 max-w-xl mx-auto">
            Start analyzing problems today. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'px-4 py-2 text-[15px] font-medium rounded-md transition-colors',
              billingPeriod === 'monthly'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-900',
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={cn(
              'px-4 py-2 text-[15px] font-medium rounded-md transition-colors flex items-center gap-2',
              billingPeriod === 'annual'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-900',
            )}
          >
            Yearly
            <span
              className={cn(
                'text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded',
                billingPeriod === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-100 text-zinc-600',
              )}
            >
              Save 17%
            </span>
          </button>
        </div>

        {/* Error message */}
        {checkout.error && (
          <div
            className="mb-8 max-w-xl mx-auto border-l-2 border-zinc-400 bg-zinc-50 py-4 pr-4 pl-6"
            role="alert"
          >
            <p className="text-[14px] tracking-[-0.02em] text-zinc-600">
              {checkout.error}
            </p>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleProducts.map((product) => {
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
            const isHighlighted = product.highlighted === true;

            // Extract metrics from features
            const { problemsPerMonth, seats } = extractMetrics(product.features);

            return (
              <div
                key={product.id}
                className={cn(
                  'relative flex flex-col rounded-xl border bg-white p-6 transition-all',
                  isHighlighted
                    ? 'border-l-4 border-zinc-900 border-t border-r border-b border-t-zinc-200 border-r-zinc-200 border-b-zinc-200 shadow-lg ring-1 ring-zinc-900/5'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm',
                )}
              >
                {/* Recommended Badge */}
                {isHighlighted && (
                  <div className="absolute -top-3 left-6">
                    <span className="bg-zinc-900 text-white text-[11px] font-semibold tracking-[0.06em] uppercase px-3 py-1 rounded">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-5">
                  <h3 className="text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-[14px] text-zinc-500 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[36px] font-semibold tracking-tight text-zinc-900">
                      ${displayPrice}
                    </span>
                    <span className="text-[14px] text-zinc-500">/mo</span>
                  </div>
                  {billingPeriod === 'annual' && (
                    <p className="text-[12px] text-zinc-400 mt-1">
                      Billed ${price.toLocaleString()}/year
                    </p>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="flex gap-4 mb-5 pb-5 border-b border-zinc-100">
                  {problemsPerMonth && (
                    <div>
                      <span className="text-[22px] font-semibold text-zinc-900">
                        {problemsPerMonth}
                      </span>
                      <p className="text-[12px] text-zinc-500">problems/mo</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[22px] font-semibold text-zinc-900">
                      {seats}
                    </span>
                    <p className="text-[12px] text-zinc-500">
                      {seats === 1 ? 'seat' : 'seats'}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-grow">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className="h-4 w-4 text-zinc-400 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-[14px] text-zinc-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(activePlan.id, product.id)}
                  disabled={pending || isCurrent || isPending}
                  className={cn(
                    'w-full py-3 px-4 text-[14px] font-medium rounded-lg transition-colors mt-auto',
                    isCurrent
                      ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                      : isHighlighted
                        ? 'cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950'
                        : 'cursor-pointer border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 active:bg-zinc-50',
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

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <p className="text-[15px] text-zinc-500">
            Need more?{' '}
            <Link
              href="/contact"
              className="text-zinc-900 font-medium hover:underline"
            >
              Contact us for enterprise pricing
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
