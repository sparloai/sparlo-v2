import { cn } from '@kit/ui/utils';

interface SectionSkeletonProps {
  variant?: 'cards' | 'list' | 'table';
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-zinc-200', className)} />;
}

export function SectionSkeleton({
  variant = 'cards',
  className,
}: SectionSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <SkeletonPulse className="h-7 w-48" />
      </div>

      {/* Content skeleton based on variant */}
      {variant === 'cards' && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="space-y-4 rounded-xl border border-zinc-200 p-6"
            >
              <div className="flex items-center gap-2">
                <SkeletonPulse className="h-6 w-20" />
                <SkeletonPulse className="h-6 w-24" />
              </div>
              <SkeletonPulse className="h-5 w-3/4" />
              <div className="space-y-2">
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-5/6" />
                <SkeletonPulse className="h-4 w-4/6" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'list' && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-zinc-100 p-4"
            >
              <SkeletonPulse className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonPulse className="h-5 w-1/3" />
                <SkeletonPulse className="h-4 w-full" />
                <SkeletonPulse className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {variant === 'table' && (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <div className="border-b border-zinc-200 bg-zinc-50 p-4">
            <div className="flex gap-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <SkeletonPulse key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-zinc-100 p-4 last:border-0">
              <div className="flex gap-8">
                {[1, 2, 3, 4, 5].map((j) => (
                  <SkeletonPulse key={j} className="h-4 w-24" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SectionEmptyStateProps {
  message: string;
  className?: string;
}

export function SectionEmptyState({
  message,
  className,
}: SectionEmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-zinc-100 p-8 text-center',
        className,
      )}
    >
      <p className="text-zinc-500">{message}</p>
    </div>
  );
}

interface SectionErrorStateProps {
  message?: string;
  className?: string;
}

export function SectionErrorState({
  message = 'Unable to load section',
  className,
}: SectionErrorStateProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-rose-200 bg-rose-50 p-8 text-center',
        className,
      )}
    >
      <p className="text-rose-700">{message}</p>
    </div>
  );
}
