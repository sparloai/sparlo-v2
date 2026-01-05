import { ArrowLeft, Clock } from 'lucide-react';

import { AppLink } from '~/components/app-link';

interface TokenGateScreenProps {
  variant: 'subscription_required' | 'limit_exceeded';
  periodEnd?: string | null;
  percentage?: number;
}

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

  // Subscription required - simple message
  if (!isLimitExceeded) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-xl px-8 pt-24 pb-16 text-center">
          <p className="mb-8 text-[18px] leading-[1.5] tracking-[-0.02em] text-zinc-600">
            You&apos;ve explored your free report. Subscribe to continue
            generating reports.
          </p>

          <AppLink
            href="/home/billing"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            View Plans
          </AppLink>
        </div>
      </main>
    );
  }

  // Limit exceeded - show usage stats
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
        {/* Back Link */}
        <AppLink
          href="/home/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Reports
        </AppLink>

        {/* Page Title */}
        <h1 className="font-heading mb-4 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          Monthly Limit Reached
        </h1>

        {/* Subtitle */}
        <p className="mb-12 max-w-xl text-[18px] leading-[1.5] tracking-[-0.02em] text-zinc-500">
          You&apos;ve used all your analysis tokens for this period. Your limit
          resets on {resetDate}.
        </p>

        {/* Content with Left Border Accent */}
        <div className="border-l-2 border-zinc-900 pl-10">
          {/* Usage Stats */}
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

          {/* Upgrade CTA */}
          <AppLink
            href="/home/billing"
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-8 py-4 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Upgrade Plan
          </AppLink>
        </div>
      </div>
    </main>
  );
}
