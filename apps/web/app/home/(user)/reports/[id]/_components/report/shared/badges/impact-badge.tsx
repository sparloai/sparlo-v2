import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

import { cn } from '@kit/ui/utils';

type ImpactLevel = 'high' | 'medium' | 'low';

interface ImpactBadgeProps {
  level: ImpactLevel;
  showIcon?: boolean;
  className?: string;
}

// Per Jobs Standard: muted colors, no alarm tones
const impactConfig = {
  high: {
    styles: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    icon: AlertTriangle,
    label: 'High Impact',
  },
  medium: {
    styles: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    icon: AlertCircle,
    label: 'Medium Impact',
  },
  low: {
    styles: 'bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400',
    icon: Info,
    label: 'Low Impact',
  },
} as const satisfies Record<
  ImpactLevel,
  { styles: string; icon: typeof AlertTriangle; label: string }
>;

export function ImpactBadge({
  level,
  showIcon = false,
  className,
}: ImpactBadgeProps) {
  const config = impactConfig[level];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.styles,
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />}
      {config.label}
    </span>
  );
}
