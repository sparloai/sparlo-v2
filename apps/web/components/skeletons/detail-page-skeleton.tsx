import { Skeleton } from '@kit/ui/skeleton';

interface DetailPageSkeletonProps {
  /** Show back button. Default: true */
  withBackButton?: boolean;
  /** Show sidebar. Default: false */
  withSidebar?: boolean;
}

/**
 * Skeleton for detail/show pages (single item view).
 * Displays a header with title and actions, plus main content area.
 */
export function DetailPageSkeleton({
  withBackButton = true,
  withSidebar = false,
}: DetailPageSkeletonProps) {
  return (
    <div className="p-6">
      {/* Back button */}
      {withBackButton && <Skeleton className="h-8 w-24 mb-4" />}

      <div className={`flex gap-6 ${withSidebar ? '' : 'max-w-4xl'}`}>
        <main className="flex-1 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" /> {/* Title */}
            <Skeleton className="h-4 w-1/2" /> {/* Subtitle/meta */}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" /> {/* Icon button */}
          </div>

          {/* Main content */}
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" /> {/* Hero/preview */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Sections */}
          <div className="space-y-4 pt-4">
            <Skeleton className="h-6 w-32" /> {/* Section title */}
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full rounded" />
              <Skeleton className="h-24 w-full rounded" />
            </div>
          </div>
        </main>

        {withSidebar && (
          <aside className="w-64 shrink-0 space-y-4">
            <Skeleton className="h-6 w-24" /> {/* Sidebar title */}
            <Skeleton className="h-32 w-full rounded" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </aside>
        )}
      </div>
    </div>
  );
}
