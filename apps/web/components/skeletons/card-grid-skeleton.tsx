import { Skeleton } from '@kit/ui/skeleton';

interface CardGridSkeletonProps {
  /** Number of cards to show. Default: 6 */
  cardCount?: 3 | 6 | 9;
  /** Grid columns. Default: 3 */
  columns?: 2 | 3 | 4;
}

/**
 * Skeleton for card grid layouts (dashboards, team pages, project lists).
 * Displays a header with action button and a responsive card grid.
 */
export function CardGridSkeleton({
  cardCount = 6,
  columns = 3,
}: CardGridSkeletonProps) {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className="p-6 space-y-6">
      {/* Header with title and action button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Card grid */}
      <div className={`grid ${gridClass} gap-4`}>
        {Array.from({ length: cardCount }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" /> {/* Title */}
            <Skeleton className="h-4 w-full" /> {/* Description line 1 */}
            <Skeleton className="h-4 w-2/3" /> {/* Description line 2 */}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-16 rounded-full" /> {/* Badge */}
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
