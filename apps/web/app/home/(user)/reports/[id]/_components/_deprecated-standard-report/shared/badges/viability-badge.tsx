import { cn } from '@kit/ui/utils';

import type { ViabilityVerdictType } from '../../../../_lib/schema/sparlo-report.schema';

interface ViabilityBadgeProps {
  viability: ViabilityVerdictType;
  label?: string;
  className?: string;
}

// Per Jobs Standard: muted colors, no alarm tones, no borders
const viabilityConfig = {
  GREEN: {
    container: 'bg-emerald-50 dark:bg-emerald-950/30',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-400',
    defaultLabel: 'Viable',
  },
  YELLOW: {
    container: 'bg-amber-50 dark:bg-amber-950/30',
    dot: 'bg-amber-500 dark:bg-amber-400',
    text: 'text-amber-700 dark:text-amber-400',
    defaultLabel: 'Conditional',
  },
  RED: {
    container: 'bg-zinc-100 dark:bg-zinc-800',
    dot: 'bg-zinc-500 dark:bg-zinc-400',
    text: 'text-zinc-600 dark:text-zinc-400',
    defaultLabel: 'Not Viable',
  },
} as const satisfies Record<
  ViabilityVerdictType,
  { container: string; dot: string; text: string; defaultLabel: string }
>;

export function ViabilityBadge({
  viability,
  label,
  className,
}: ViabilityBadgeProps) {
  const config = viabilityConfig[viability];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-2.5 py-1',
        config.container,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      <span className={cn('text-xs font-medium', config.text)}>
        {label || config.defaultLabel}
      </span>
    </div>
  );
}
