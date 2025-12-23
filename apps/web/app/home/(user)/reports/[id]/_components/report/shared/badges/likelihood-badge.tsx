import { cn } from '@kit/ui/utils';

import type { LikelihoodColorType } from '../../../../_lib/schema/sparlo-report.schema';

interface LikelihoodBadgeProps {
  color?: LikelihoodColorType;
  label: string;
  className?: string;
}

const likelihoodStyles = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
  gray: 'bg-zinc-50 text-zinc-600 border-zinc-200',
} as const satisfies Record<LikelihoodColorType, string>;

export function LikelihoodBadge({
  color = 'gray',
  label,
  className,
}: LikelihoodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        likelihoodStyles[color],
        className,
      )}
    >
      {label}
    </span>
  );
}
