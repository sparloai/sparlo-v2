'use client';

import { Suspense } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import { AppLink } from '~/components/app-link';

import { useAnalysisMode } from '../_lib/use-analysis-mode';
import { DueDiligenceAnalysisForm } from './due-diligence-analysis-form';
import { TechnicalAnalysisForm } from './technical-analysis-form';

interface ReportModeSelectorProps {
  prefill?: string;
  error?: string;
}

function ReportModeSelectorContent({
  prefill,
  error,
}: ReportModeSelectorProps) {
  const { mode, setMode } = useAnalysisMode();

  return (
    <main className="flex flex-col bg-white">
      <div className="px-8 pt-24 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link */}
          <AppLink
            href="/app/reports"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            All Reports
          </AppLink>

          {/* Page title */}
          <h1 className="font-heading mb-8 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            New Analysis
          </h1>

          {/* Tab selector */}
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as 'technical' | 'dd')}
          >
            <TabsList className="mb-8 inline-flex h-12 items-center rounded-lg bg-zinc-100 p-1">
              <TabsTrigger
                value="technical"
                className="rounded-md px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-600 transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">Solve a Problem</span>
                <span className="sm:hidden">Problem</span>
              </TabsTrigger>
              <TabsTrigger
                value="dd"
                className="rounded-md px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-600 transition-all data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
              >
                <span className="hidden sm:inline">Investor Due Diligence</span>
                <span className="sm:hidden">Due Diligence</span>
              </TabsTrigger>
            </TabsList>

            {/* forceMount keeps both forms in DOM, CSS hides inactive one */}
            {/* This preserves form state without lifting state to parent */}
            <TabsContent
              value="technical"
              forceMount
              className={mode !== 'technical' ? 'hidden' : ''}
            >
              <TechnicalAnalysisForm prefill={prefill} error={error} />
            </TabsContent>

            <TabsContent
              value="dd"
              forceMount
              className={mode !== 'dd' ? 'hidden' : ''}
            >
              <DueDiligenceAnalysisForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

/**
 * Fallback component that shows real tab buttons while useSearchParams loads.
 * This eliminates the perceived delay where buttons appear unclickable.
 */
function ReportModeSelectorFallback() {
  return (
    <main className="flex flex-col bg-white">
      <div className="px-8 pt-24 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link - static */}
          <span className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400">
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            All Reports
          </span>

          {/* Page title - static */}
          <h1 className="font-heading mb-8 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
            New Analysis
          </h1>

          {/* Tab buttons - real, visible immediately */}
          <div className="mb-8 inline-flex h-12 items-center rounded-lg bg-zinc-100 p-1">
            <button
              type="button"
              className="rounded-md bg-white px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-900 shadow-sm"
            >
              <span className="hidden sm:inline">Solve a Problem</span>
              <span className="sm:hidden">Problem</span>
            </button>
            <button
              type="button"
              className="rounded-md px-6 py-2 text-[14px] font-medium tracking-[-0.02em] text-zinc-600"
            >
              <span className="hidden sm:inline">Investor Due Diligence</span>
              <span className="sm:hidden">Due Diligence</span>
            </button>
          </div>

          {/* Form skeleton */}
          <div className="h-96 animate-pulse rounded-lg border border-zinc-200 bg-zinc-50" />
        </div>
      </div>
    </main>
  );
}

export function ReportModeSelector({
  prefill,
  error,
}: ReportModeSelectorProps) {
  // Wrap in Suspense because useSearchParams requires it
  return (
    <Suspense fallback={<ReportModeSelectorFallback />}>
      <ReportModeSelectorContent prefill={prefill} error={error} />
    </Suspense>
  );
}
