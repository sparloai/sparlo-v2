import { cn } from '@kit/ui/utils';

import type { ViabilityVerdictType } from '../../../../_lib/schema/sparlo-report.schema';

interface ViabilityBadgeProps {
  viability: ViabilityVerdictType;
  label?: string;
  className?: string;
}

const viabilityConfig = {
  GREEN: {
    container: 'bg-emerald-50 border-emerald-200',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    defaultLabel: 'Viable',
  },
  YELLOW: {
    container: 'bg-amber-50 border-amber-200',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    defaultLabel: 'Conditional',
  },
  RED: {
    container: 'bg-rose-50 border-rose-200',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
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
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1',
        config.container,
        className,
      )}
    >
      <span className={cn('h-2 w-2 rounded-full', config.dot)} />
      <span className={cn('text-xs font-medium', config.text)}>
        {label || config.defaultLabel}
      </span>
    </div>
  );
}
