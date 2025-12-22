'use client';

import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';

interface ConfidenceBadgeProps {
  level?: string;
}

const levelConfig: Record<string, { className: string }> = {
  high: {
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  medium: {
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  low: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
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
