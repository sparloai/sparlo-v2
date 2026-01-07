'use client';

import { Check, CreditCard } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

interface AuraCurrentPlanCardProps {
  planName: string;
  price: number;
  interval: string;
  status: string;
  periodEnd: string;
  features: string[];
  onManageSubscription: () => void;
}

export function AuraCurrentPlanCard({
  planName,
  price,
  interval,
  status,
  periodEnd,
  features,
  onManageSubscription,
}: AuraCurrentPlanCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 p-6">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-zinc-950" />
          <h3 className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
            Current Plan
          </h3>
        </div>
        <span
          className={cn(
            'rounded border px-2.5 py-1 font-mono text-xs font-medium tracking-widest uppercase',
            status === 'active'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : status === 'canceled'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-zinc-200 bg-zinc-50 text-zinc-700',
          )}
        >
          {status === 'active'
            ? 'Active'
            : status === 'canceled'
              ? 'Canceling'
              : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-6 sm:p-8">
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-zinc-950 sm:text-3xl">
            {planName}
          </span>
          <span className="text-zinc-600">
            • ${price}/{interval}
          </span>
        </div>

        <div className="mb-6 space-y-1">
          <span className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
            Next Billing Date
          </span>
          <div className="text-base text-zinc-900">
            {new Date(periodEnd).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        <div className="mb-8 space-y-2">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-zinc-700"
            >
              <Check className="h-4 w-4 text-emerald-600" />
              {feature}
            </div>
          ))}
        </div>

        <Button
          onClick={onManageSubscription}
          className="min-h-[44px] w-full bg-zinc-950 text-white hover:bg-zinc-800"
        >
          Manage Subscription
        </Button>
      </div>
    </section>
  );
}
