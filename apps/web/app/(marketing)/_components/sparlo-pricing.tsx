import Link from 'next/link';

import { Check } from 'lucide-react';

const tiers = [
  {
    name: 'Core',
    price: 199,
    features: ['Standard usage', '1 account', 'Full report access'],
    cta: 'Start with Core',
    href: '/auth/sign-up?plan=core',
  },
  {
    name: 'Pro',
    price: 499,
    features: [
      '3× usage limits',
      '5 team accounts',
      'Shared report library',
      'Priority support',
    ],
    cta: 'Start with Pro',
    href: '/auth/sign-up?plan=pro',
  },
  {
    name: 'Max',
    price: 999,
    features: [
      '6× usage limits',
      '10 team accounts',
      'Shared report library',
      'Priority support',
    ],
    cta: 'Start with Max',
    href: '/auth/sign-up?plan=max',
  },
];

export function SparloPricing() {
  return (
    <main className="flex flex-grow flex-col items-center justify-center py-20 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-6">
        {/* Section Header */}
        <div className="mb-20 max-w-2xl">
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl dark:text-white">
            Plans
          </h1>
          <p className="text-lg font-normal leading-relaxed text-zinc-500 dark:text-zinc-400">
            Engineering intelligence for professional teams.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 items-stretch gap-8 md:grid-cols-3 lg:gap-12">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="group flex flex-col rounded-lg border border-zinc-200 bg-white p-8 transition-colors duration-300 hover:border-zinc-300 md:p-10 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="mb-8">
                <h3 className="mb-6 text-xs font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight text-zinc-950 dark:text-white">
                    ${tier.price}
                  </span>
                  <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
                    /month
                  </span>
                </div>
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
                href={tier.href}
                className="bg-primary hover:bg-primary/90 block w-full rounded px-4 py-3 text-center text-sm font-medium text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {tier.cta}
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
              className="font-medium text-zinc-950 underline-offset-4 decoration-zinc-300 hover:underline dark:text-white dark:decoration-zinc-600"
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
