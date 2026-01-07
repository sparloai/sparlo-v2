import { cn } from '@kit/ui/utils';

import type { LikelihoodColorType } from '../../../../_lib/schema/sparlo-report.schema';

interface LikelihoodBadgeProps {
  color?: LikelihoodColorType;
  label: string;
  className?: string;
}

// Per Jobs Standard: muted colors, no alarm tones, no borders
const likelihoodStyles = {
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
  red: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  gray: 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400',
} as const satisfies Record<LikelihoodColorType, string>;

export function LikelihoodBadge({
  color = 'gray',
  label,
  className,
}: LikelihoodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        likelihoodStyles[color],
        className,
      )}
    >
      {label}
    </span>
  );
}
