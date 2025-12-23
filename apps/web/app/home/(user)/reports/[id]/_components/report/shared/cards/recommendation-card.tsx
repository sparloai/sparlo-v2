import { ArrowRight } from 'lucide-react';

import { BaseCard } from './base-card';

type Priority = 'high' | 'medium' | 'low';

interface RecommendationCardProps {
  title: string;
  description: string;
  priority?: Priority;
  action?: string;
}

const priorityStyles = {
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-blue-50 text-blue-700 border-blue-200',
} as const;

export function RecommendationCard({
  title,
  description,
  priority,
  action,
}: RecommendationCardProps) {
  return (
    <BaseCard variant="default" emphasis="subtle" className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="font-semibold text-zinc-900">{title}</h4>
        {priority && (
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyles[priority]}`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </span>
        )}
      </div>
      <p className="text-sm text-zinc-600">{description}</p>
      {action && (
        <div className="flex items-center gap-1.5 text-sm font-medium text-violet-600">
          <span>{action}</span>
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </div>
      )}
    </BaseCard>
  );
}
