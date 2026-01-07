/**
 * Skeleton loading state for the New Analysis page.
 * Shows real tab buttons immediately to eliminate perceived delay.
 * Form content shows skeleton while async operations complete.
 */
export function PageSkeleton() {
  return (
    <main className="flex flex-col bg-white">
      <div className="px-8 pt-24 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link - static text */}
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

          {/* Input card skeleton - form content loads async */}
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="flex">
              {/* Signature left border */}
              <div className="w-0.5 bg-zinc-200" />
              {/* Content */}
              <div className="flex-1 p-8">
                {/* Textarea skeleton */}
                <div className="h-48 w-full animate-pulse rounded bg-zinc-50" />

                {/* Detection indicators skeleton */}
                <div className="mt-8 flex items-center gap-6">
                  <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
                  <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
                </div>

                {/* Footer skeleton */}
                <div className="mt-10 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-4 w-28 animate-pulse rounded bg-zinc-100" />
                    <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
                  </div>
                  <div className="h-12 w-32 animate-pulse rounded bg-zinc-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
