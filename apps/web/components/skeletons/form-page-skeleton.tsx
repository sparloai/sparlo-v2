import { Skeleton } from '@kit/ui/skeleton';

interface FormPageSkeletonProps {
  /** Include sidebar navigation. Default: true for settings */
  withSidebar?: boolean;
}

/**
 * Skeleton for form-based pages (settings, profile, edit pages).
 * Matches the typical form layout with optional sidebar navigation.
 */
export function FormPageSkeleton({ withSidebar = true }: FormPageSkeletonProps) {
  return (
    <div className="flex gap-6 p-6">
      {withSidebar && (
        <aside className="w-64 shrink-0 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-8 w-2/3" />
        </aside>
      )}
      <main className="flex-1 space-y-6 max-w-2xl">
        {/* Page title */}
        <Skeleton className="h-8 w-48" />

        {/* Form sections - matches typical settings form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" /> {/* Label */}
            <Skeleton className="h-10 w-full" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-24 w-full" /> {/* Textarea */}
          </div>
        </div>

        {/* Action button */}
        <Skeleton className="h-10 w-32" />
      </main>
    </div>
  );
}
