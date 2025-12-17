import { cn } from '@kit/ui/utils';

interface HomeLayoutPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export function HomeLayoutPageHeader({
  title,
  description,
  className,
}: HomeLayoutPageHeaderProps) {
  return (
    <div className={cn('border-b border-gray-200 bg-white px-4 py-6 dark:border-neutral-800 dark:bg-neutral-900 sm:px-6 lg:px-8', className)}>
      <div className="mx-auto max-w-7xl">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
