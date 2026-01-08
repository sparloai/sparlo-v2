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

  // Subscription required - minimal, confident messaging
  if (!isLimitExceeded) {
    return (
      <main className="bg-white">
        <div className="mx-auto max-w-3xl px-8 pt-16 pb-16">
          <AppLink
            href="/app"
            className="mb-8 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </AppLink>

          <div className="border-l-2 border-zinc-900 pl-10">
            <h1 className="font-heading mb-4 text-[36px] font-normal tracking-[-0.02em] text-zinc-900">
              Subscription Required
            </h1>

            <p className="mb-8 max-w-lg text-[17px] leading-[1.6] text-zinc-500">
              Your free analysis has been used. A subscription is required to
              continue generating reports.
            </p>

            <AppLink
              href="/app/billing"
              className="inline-flex items-center rounded-lg bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
            >
              View Plans
            </AppLink>
          </div>
        </div>
      </main>
    );
  }

  // Limit exceeded - show usage context
  return (
    <main className="bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-16 pb-16">
        <AppLink
          href="/app"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </AppLink>

        <div className="border-l-2 border-zinc-900 pl-10">
          <h1 className="font-heading mb-4 text-[36px] font-normal tracking-[-0.02em] text-zinc-900">
            Usage Limit Reached
          </h1>

          <p className="mb-8 max-w-lg text-[17px] leading-[1.6] text-zinc-500">
            You&apos;ve reached your monthly token allocation. Usage resets
            automatically at the start of your next billing period.
          </p>

          {/* Usage indicator */}
          <div className="mb-8 max-w-sm">
            <div className="mb-2 flex items-center justify-between text-[13px]">
              <span className="text-zinc-500">Monthly allocation</span>
              <span className="font-medium text-zinc-900">{percentage}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-zinc-900"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[13px] text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Resets {resetDate}</span>
            </div>
          </div>

          <AppLink
            href="/app/billing"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Upgrade Plan
          </AppLink>
        </div>
      </div>
    </main>
  );
}
