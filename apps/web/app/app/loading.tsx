import { Skeleton } from '@kit/ui/skeleton';

/**
 * App Loading Skeleton
 *
 * Shows a premium skeleton that mirrors the reports dashboard structure
 * for a seamless transition from loading to content.
 */
export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-[--surface-base]">
      <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-8 lg:px-10">
        {/* Header skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <Skeleton className="h-10 w-32" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        {/* Search skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        </div>

        {/* Report cards skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
              style={{
                opacity: 1 - i * 0.15,
                animationDelay: `${i * 0.1}s`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
