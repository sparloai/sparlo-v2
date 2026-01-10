import { Skeleton } from '@kit/ui/skeleton';

/**
 * Skeleton for table-based pages (admin pages, data tables).
 * Displays a header with search/filter, table structure, and pagination.
 */
export function TablePageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" /> {/* Search */}
          <Skeleton className="h-10 w-24" /> {/* Filter */}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        {/* Table header */}
        <div className="flex gap-4 p-4 border-b bg-muted/50">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border-b last:border-0">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}
