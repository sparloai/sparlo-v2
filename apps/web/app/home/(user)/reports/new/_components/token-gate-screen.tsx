import Link from 'next/link';

import { ArrowLeft, ArrowRight, Clock, Sparkles } from 'lucide-react';

interface TokenGateScreenProps {
  variant: 'subscription_required' | 'limit_exceeded';
  periodEnd?: string | null;
  percentage?: number;
}

const FEATURES = [
  'Unlimited AI-powered design analysis',
  'Deep strategic insights for every challenge',
  'Export reports in multiple formats',
  'Priority processing queue',
];

export function TokenGateScreen({
  variant,
  periodEnd,
  percentage = 100,
}: TokenGateScreenProps) {
  const isLimitExceeded = variant === 'limit_exceeded';

  const resetDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'your next billing period';

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
        {/* Back Link */}
        <Link
          href="/home/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Reports
        </Link>

        {/* Page Title */}
        <h1 className="font-heading mb-4 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          {isLimitExceeded
            ? 'Monthly Limit Reached'
            : 'Unlock Unlimited Analysis'}
        </h1>

        {/* Subtitle */}
        <p className="mb-12 max-w-xl text-[18px] leading-[1.5] tracking-[-0.02em] text-zinc-500">
          {isLimitExceeded
            ? `You've used all your analysis tokens for this period. Your limit resets on ${resetDate}.`
            : "You've explored your free report. Subscribe to continue generating powerful AI-driven design analysis."}
        </p>

        {/* Content with Left Border Accent */}
        <div className="border-l-2 border-zinc-900 pl-10">
          {isLimitExceeded ? (
            /* Usage Stats for Limit Exceeded */
            <div className="mb-10">
              <span className="mb-4 block text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                Current Usage
              </span>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[15px] text-zinc-700">
                    Monthly tokens
                  </span>
                  <span className="text-[15px] font-medium text-zinc-900">
                    {percentage}% used
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-zinc-900"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[13px] text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Resets {resetDate}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Features for Subscription Required */
            <div className="mb-10">
              <span className="mb-4 block text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                What you&apos;ll unlock
              </span>
              <div className="space-y-4">
                {FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-zinc-900" />
                    <span className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing/Upgrade Hint */}
          <div className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
            <div className="mb-2 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-zinc-600" />
              <span className="text-[15px] font-medium text-zinc-900">
                {isLimitExceeded
                  ? 'Need more capacity?'
                  : 'Plans start at $199/month'}
              </span>
            </div>
            <p className="text-[14px] text-zinc-500">
              {isLimitExceeded
                ? 'Upgrade your plan for higher limits and additional features'
                : "Choose from Standard, Pro, or Max based on your team's needs"}
            </p>
          </div>

          {/* Single Primary CTA */}
          <Link
            href="/home/billing"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-8 py-4 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            {isLimitExceeded ? 'Upgrade Plan' : 'View Plans'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
