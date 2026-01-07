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
    <div
      className={cn(
        'border-b border-[--border-default] bg-[--surface-elevated] px-4 py-6 sm:px-6 lg:px-8',
        className,
      )}
    >
      <div className="mx-auto max-w-7xl">
        <h1 className="text-xl font-semibold text-[--text-primary]">{title}</h1>
        {description && (
          <div className="mt-1 text-sm text-[--text-muted]">{description}</div>
        )}
      </div>
    </div>
  );
}
