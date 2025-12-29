import { cn } from '@kit/ui/utils';

import type { ConfidenceLevelType } from '../../../../_lib/schema/sparlo-report.schema';

interface ConfidenceBadgeProps {
  level: ConfidenceLevelType;
  showIcon?: boolean;
  className?: string;
}

// Per Jobs Standard: muted colors, no alarm tones, no borders
const confidenceConfig = {
  HIGH: {
    styles:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    label: 'High',
  },
  MEDIUM: {
    styles:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    label: 'Medium',
  },
  LOW: {
    styles: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    label: 'Low',
  },
} as const satisfies Record<
  ConfidenceLevelType,
  { styles: string; label: string }
>;

export function ConfidenceBadge({
  level,
  showIcon: _showIcon = false,
  className,
}: ConfidenceBadgeProps) {
  const config = confidenceConfig[level];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        config.styles,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
