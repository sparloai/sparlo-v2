import { ArrowLeft, Clock } from 'lucide-react';

import { AppLink } from '~/components/app-link';

interface TokenGateScreenProps {
  variant: 'subscription_required' | 'limit_exceeded';
  periodEnd?: string | null;
}

export function TokenGateScreen({
  variant,
  periodEnd,
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

  // Limit exceeded - show usage context with upgrade CTA
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
            Out of Credits
          </h1>

          <p className="mb-6 max-w-lg text-[17px] leading-[1.6] text-zinc-500">
            You&apos;ve used all your credits for this month.
          </p>

          {/* Reset date */}
          <div className="mb-8 flex items-center gap-2 text-[15px] text-zinc-600">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>
              Usage resets <span className="font-medium">{resetDate}</span>
            </span>
          </div>

          <p className="mb-8 max-w-lg text-[17px] leading-[1.6] text-zinc-500">
            Upgrade your plan to keep analyzing.
          </p>

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
