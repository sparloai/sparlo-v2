/**
 * Skeleton loading state for the New Analysis page.
 * Matches the layout of the actual form to prevent layout shift.
 */
export function PageSkeleton() {
  return (
    <main className="flex flex-col bg-white">
      <div className="px-8 pt-24 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Back link skeleton */}
          <div className="mb-6 h-4 w-24 animate-pulse rounded bg-zinc-100" />

          {/* Page title skeleton */}
          <div className="mb-12 h-12 w-64 animate-pulse rounded bg-zinc-100" />

          {/* Input card skeleton */}
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
