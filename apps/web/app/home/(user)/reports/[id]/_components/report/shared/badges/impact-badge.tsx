import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

import { cn } from '@kit/ui/utils';

type ImpactLevel = 'high' | 'medium' | 'low';

interface ImpactBadgeProps {
  level: ImpactLevel;
  showIcon?: boolean;
  className?: string;
}

const impactConfig = {
  high: {
    styles: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: AlertTriangle,
    label: 'High Impact',
  },
  medium: {
    styles: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertCircle,
    label: 'Medium Impact',
  },
  low: {
    styles: 'bg-blue-50 text-blue-700 border-blue-200',
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
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        config.styles,
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />}
      {config.label}
    </span>
  );
}
