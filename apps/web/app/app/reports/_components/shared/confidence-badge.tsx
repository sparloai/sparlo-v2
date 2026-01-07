'use client';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

interface ConfidenceBadgeProps {
  level?: string;
}

const levelConfig: Record<string, { className: string }> = {
  high: {
    className:
      'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
  },
  medium: {
    className:
      'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  },
  low: {
    className:
      'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700',
  },
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const config = level ? levelConfig[level.toLowerCase()] : levelConfig.medium;

  return (
    <Badge
      variant="secondary"
      className={cn('text-xs capitalize', config?.className)}
    >
      {level || 'Medium'} Confidence
    </Badge>
  );
}
