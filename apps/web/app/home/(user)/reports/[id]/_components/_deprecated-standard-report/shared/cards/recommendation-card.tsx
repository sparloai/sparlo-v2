import { ArrowRight } from 'lucide-react';

import { BaseCard } from './base-card';

type Priority = 'high' | 'medium' | 'low';

interface RecommendationCardProps {
  title: string;
  description: string;
  priority?: Priority;
  action?: string;
}

// Per Jobs Standard: muted colors, no borders
const priorityStyles = {
  high: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  low: 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400',
} as const;

export function RecommendationCard({
  title,
  description,
  priority,
  action,
}: RecommendationCardProps) {
  return (
    <BaseCard variant="default" emphasis="subtle" className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h4>
        {priority && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${priorityStyles[priority]}`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {description}
      </p>
      {action && (
        <div className="flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400">
          <span>{action}</span>
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </div>
      )}
    </BaseCard>
  );
}
