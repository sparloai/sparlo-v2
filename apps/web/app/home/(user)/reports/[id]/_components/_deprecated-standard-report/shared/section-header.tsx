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

// Per Jobs Standard: consistent spacing rhythm (mb-10 for major sections)
export function SectionHeader({
  id,
  title,
  icon: _Icon,
  badge,
  count,
  children,
  className,
}: SectionHeaderProps) {
  return (
    <div
      id={id}
      className={cn(
        'mb-10 flex items-center justify-between border-b border-zinc-100 pb-6 dark:border-zinc-800',
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
          {title}
        </h2>
        {count !== undefined && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-sm font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {count}
          </span>
        )}
        {badge}
      </div>
      {children}
    </div>
  );
}
