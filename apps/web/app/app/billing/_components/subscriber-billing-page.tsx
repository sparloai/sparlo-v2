'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { ArrowUpRight, ExternalLink, Loader2, X } from 'lucide-react';

import { AppLink } from '~/components/app-link';
import type { UsageCheckResponse } from '~/lib/usage/schemas';

import { createPersonalAccountBillingPortalSession } from '../_lib/server/server-actions';
import { PlanUsageLimits } from './plan-usage-limits';

interface SubscriberBillingPageProps {
  usage: UsageCheckResponse | null;
  periodEnd: string;
  planName: string;
  planInterval: 'month' | 'year';
  canUpgrade: boolean;
  showUpdateSuccess?: boolean;
}

export function SubscriberBillingPage({
  usage,
  periodEnd,
  planName,
  planInterval,
  canUpgrade,
  showUpdateSuccess,
}: SubscriberBillingPageProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [showBanner, setShowBanner] = useState(showUpdateSuccess);

  // Auto-dismiss success banner after 5 seconds
  useEffect(() => {
    if (showUpdateSuccess) {
      const timer = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showUpdateSuccess]);

  const handleManageBilling = () => {
    startTransition(() => {
      formRef.current?.requestSubmit();
    });
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-8 pt-24 pb-16">
        {/* Back link */}
        <AppLink
          href="/app"
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
        </AppLink>

        {/* Success indicator */}
        {showBanner && (
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
              <p className="text-[15px] text-zinc-600">Subscription updated</p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-zinc-400 transition-colors hover:text-zinc-600"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page title */}
        <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          Billing
        </h1>

        <div className="mt-10 space-y-6">
          {/* Current Plan Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Current plan
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-900">
                  {planName}
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Billed {planInterval === 'year' ? 'annually' : 'monthly'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
                <span className="text-[13px] font-medium tracking-[0.06em] text-zinc-500 uppercase">
                  Active
                </span>
              </div>
            </div>
            {canUpgrade && (
              <button
                onClick={handleManageBilling}
                disabled={isPending}
                className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Upgrade Plan
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Plan Usage Limits */}
          {usage && (
            <PlanUsageLimits
              tokensUsed={usage.tokens_used}
              tokensLimit={usage.tokens_limit}
              periodEnd={periodEnd}
            />
          )}

          {/* Manage Billing Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-zinc-900">
              Manage subscription
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Update payment method, view invoices, or cancel your subscription.
            </p>

            {/* Hidden form for billing portal session */}
            <form
              ref={formRef}
              action={createPersonalAccountBillingPortalSession}
              className="hidden"
            />

            <button
              onClick={handleManageBilling}
              disabled={isPending}
              className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
            >
              {isPending ? (
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
        </div>
      </div>
    </main>
  );
}
