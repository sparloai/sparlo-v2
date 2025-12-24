import type { LucideIcon } from 'lucide-react';

import { cn } from '@kit/ui/utils';

interface SectionHeaderProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
  count?: number;
  children?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  id,
  title,
  icon: Icon,
  badge,
  count,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div
      id={id}
      className={cn(
        'mb-6 flex items-center justify-between border-b border-zinc-200 pb-4',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="h-6 w-6 text-zinc-500" strokeWidth={1.5} />}
        <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
        {count !== undefined && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-sm font-medium text-zinc-600">
            {count}
          </span>
        )}
        {badge}
      </div>
      {children}
    </div>
  );
}
