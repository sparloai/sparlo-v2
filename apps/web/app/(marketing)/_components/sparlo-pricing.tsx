'use client';

import { useState } from 'react';

import Link from 'next/link';

import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Core',
    description: 'For individual researchers',
    monthlyPrice: 199,
    annualPrice: 166, // ~17% off (2 months free)
    features: ['Standard usage', '1 seat', 'Email support'],
    href: '/auth/sign-up?plan=core',
  },
  {
    name: 'Pro',
    description: 'For small teams',
    monthlyPrice: 499,
    annualPrice: 416, // ~17% off (2 months free)
    features: ['3× usage', '5 seats', 'Priority support'],
    href: '/auth/sign-up?plan=pro',
    highlighted: true,
  },
  {
    name: 'Max',
    description: 'For larger organizations',
    monthlyPrice: 999,
    annualPrice: 833, // ~17% off (2 months free)
    features: ['7× usage', '10 seats', 'Dedicated support'],
    href: '/auth/sign-up?plan=max',
  },
];

export function SparloPricing() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>(
    'monthly',
  );

  return (
    <main className="flex flex-grow flex-col items-center justify-center py-20 md:py-32">
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

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3 lg:gap-12">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`group relative flex flex-col rounded-lg border p-8 transition-colors duration-300 md:p-10 ${
                tier.highlighted
                  ? 'border-primary/50 bg-white dark:border-primary/30 dark:bg-zinc-900'
                  : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
              }`}
            >
              <div className="mb-8">
                <h3 className="mb-1 text-xs font-medium tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                  {tier.name}
                </h3>
                <p className="mb-6 text-sm text-zinc-400 dark:text-zinc-500">
                  {tier.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
                    $
                    {billingPeriod === 'monthly'
                      ? tier.monthlyPrice
                      : tier.annualPrice}
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
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-base font-normal text-zinc-700 dark:text-zinc-300">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href={`${tier.href}&billing=${billingPeriod}`}
                className={`block w-full rounded px-4 py-3 text-center text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
                  tier.highlighted
                    ? 'bg-primary hover:bg-primary/90 focus-visible:ring-primary text-white'
                    : 'bg-primary/20 text-primary hover:bg-primary/30 focus-visible:ring-primary dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30'
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
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
