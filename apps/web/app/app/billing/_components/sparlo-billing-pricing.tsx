'use client';

import { useCallback, useRef, useState, useTransition } from 'react';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import Link from 'next/link';

import { Check, ExternalLink, Loader2 } from 'lucide-react';

import type { BillingConfig } from '@kit/billing';
import { getPrimaryLineItem } from '@kit/billing';
import { useAppEvents } from '@kit/shared/events';
import { cn } from '@kit/ui/utils';

import {
  createPersonalAccountBillingPortalSession,
  createPersonalAccountCheckoutSession,
} from '../_lib/server/server-actions';

interface SparloBillingPricingProps {
  config: BillingConfig;
  customerId: string | null | undefined;
  currentPlanId?: string;
}

interface CheckoutState {
  selectedPlan: string | null;
  error: string | null;
}

const initialCheckoutState: CheckoutState = {
  selectedPlan: null,
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
  const [portalPending, startPortalTransition] = useTransition();
  const [checkout, setCheckout] = useState<CheckoutState>(initialCheckoutState);
  const appEvents = useAppEvents();
  const portalFormRef = useRef<HTMLFormElement>(null);

  const isSubscriber = !!currentPlanId;

  const handleManageBilling = useCallback(() => {
    startPortalTransition(() => {
      portalFormRef.current?.requestSubmit();
    });
  }, []);

  const handleSelectPlan = useCallback(
    (planId: string, productId: string) => {
      setCheckout((prev) => ({ ...prev, selectedPlan: planId, error: null }));
      startTransition(async () => {
        try {
          appEvents.emit({ type: 'checkout.started', payload: { planId } });
          // Server action redirects to Stripe checkout page
          await createPersonalAccountCheckoutSession({
            planId,
            productId,
          });
        } catch (error) {
          // redirect() throws an error, so we need to rethrow it
          if (isRedirectError(error)) {
            throw error;
          }
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

  // Get visible products
  const visibleProducts = config.products.filter((p) => !p.hidden);

  // Empty state when no products configured
  if (visibleProducts.length === 0) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-5xl px-8 pt-24 pb-16">
          <div className="text-center">
            <h1 className="font-heading mb-4 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
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
        {/* Hidden form for billing portal */}
        <form
          ref={portalFormRef}
          action={createPersonalAccountBillingPortalSession}
          className="hidden"
        />

        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            {isSubscriber ? 'Upgrade your plan' : 'Choose your plan'}
          </h1>
          <p className="mx-auto max-w-xl text-[18px] text-zinc-500">
            {isSubscriber
              ? 'Need more credits? Upgrade to a higher tier.'
              : 'Start analyzing problems today. Upgrade or downgrade anytime.'}
          </p>
        </div>

        {/* Manage Billing for Subscribers */}
        {isSubscriber && (
          <div className="mx-auto mb-12 max-w-md rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center">
            <p className="mb-4 text-[15px] text-zinc-600">
              Need to update your payment method or view invoices?
            </p>
            <button
              onClick={handleManageBilling}
              disabled={portalPending}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-[14px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
            >
              {portalPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Manage billing
                  <ExternalLink className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="mb-12 flex items-center justify-center gap-3">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              'rounded-md px-4 py-2 text-[15px] font-medium transition-colors',
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
              'flex items-center gap-2 rounded-md px-4 py-2 text-[15px] font-medium transition-colors',
              billingPeriod === 'annual'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-500 hover:text-zinc-900',
            )}
          >
            Yearly
            <span
              className={cn(
                'rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase',
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
            className="mx-auto mb-8 max-w-xl border-l-2 border-zinc-400 bg-zinc-50 py-4 pr-4 pl-6"
            role="alert"
          >
            <p className="text-[14px] tracking-[-0.02em] text-zinc-600">
              {checkout.error}
            </p>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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
            const { problemsPerMonth, seats } = extractMetrics(
              product.features,
            );

            return (
              <div
                key={product.id}
                className={cn(
                  'relative flex flex-col rounded-xl border bg-white p-6 transition-all',
                  isHighlighted
                    ? 'border-t border-r border-b border-l-4 border-zinc-900 border-t-zinc-200 border-r-zinc-200 border-b-zinc-200 shadow-lg ring-1 ring-zinc-900/5'
                    : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm',
                )}
              >
                {/* Plan Header */}
                <div className="mb-5">
                  <h3 className="mb-2 text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                    {product.name}
                  </h3>
                  <p className="text-[14px] leading-relaxed text-zinc-500">
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
                    <p className="mt-1 text-[12px] text-zinc-400">
                      Billed ${price.toLocaleString()}/year
                    </p>
                  )}
                </div>

                {/* Key Metrics */}
                <div className="mb-5 flex gap-4 border-b border-zinc-100 pb-5">
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
                <ul className="mb-6 flex-grow space-y-2.5">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400"
                        aria-hidden="true"
                      />
                      <span className="text-[14px] text-zinc-600">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (isSubscriber && !isCurrent) {
                      // Existing subscribers upgrade via billing portal
                      handleManageBilling();
                    } else {
                      // New users go to checkout
                      handleSelectPlan(activePlan.id, product.id);
                    }
                  }}
                  disabled={pending || portalPending || isCurrent || isPending}
                  className={cn(
                    'mt-auto w-full rounded-lg px-4 py-3 text-[14px] font-medium transition-colors',
                    isCurrent
                      ? 'bg-zinc-100 text-zinc-400'
                      : isHighlighted
                        ? 'cursor-pointer bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950'
                        : 'cursor-pointer border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 active:bg-zinc-50',
                    (pending || portalPending || isPending) && 'opacity-50',
                  )}
                >
                  {isPending || (portalPending && !isCurrent)
                    ? 'Loading...'
                    : isCurrent
                      ? 'Current Plan'
                      : isSubscriber
                        ? 'Upgrade'
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
              className="font-medium text-zinc-900 hover:underline"
            >
              Contact us for enterprise pricing
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
