import { Skeleton } from '@kit/ui/skeleton';

/**
 * Auth Loading State
 *
 * Shows a centered card skeleton that matches the auth form layout.
 */
export default function Loading() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Skeleton className="h-8 w-20" />
        </div>

        {/* Card */}
        <div className="border-border bg-card rounded-xl border p-8 shadow-sm">
          {/* Title */}
          <div className="mb-6 space-y-2 text-center">
            <Skeleton className="mx-auto h-7 w-48" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>

          {/* Form field */}
          <div className="mb-4 space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Button */}
          <Skeleton className="h-10 w-full rounded-md" />

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* Social button */}
          <Skeleton className="h-10 w-full rounded-md" />

          {/* Footer link */}
          <div className="mt-6 flex justify-center">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
