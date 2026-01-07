'use client';

import { ArrowLeft, RefreshCw } from 'lucide-react';

import { AppLink } from '~/components/app-link';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
        {/* Back Link */}
        <AppLink
          href="/app/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Reports
        </AppLink>

        {/* Page Title */}
        <h1 className="font-heading mb-4 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="mb-12 max-w-xl text-[18px] leading-[1.5] tracking-[-0.02em] text-zinc-500">
          We couldn&apos;t load this page. This might be a temporary issue.
          Please try again.
        </p>

        {/* Content with Left Border Accent */}
        <div className="border-l-2 border-zinc-900 pl-10">
          {/* Error Details (development only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
              <span className="mb-2 block text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
                Error Details
              </span>
              <p className="font-mono text-[14px] text-zinc-700">
                {error.message}
              </p>
              {error.digest && (
                <p className="mt-2 font-mono text-[12px] text-zinc-400">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-8 py-4 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>

            <AppLink
              href="/app/reports"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-8 py-4 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Go to Reports
            </AppLink>
          </div>
        </div>
      </div>
    </main>
  );
}
