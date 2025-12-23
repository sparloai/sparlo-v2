import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import type { ConfidenceLevelType } from '../../../../_lib/schema/sparlo-report.schema';

interface ConfidenceBadgeProps {
  level: ConfidenceLevelType;
  showIcon?: boolean;
  className?: string;
}

const confidenceConfig = {
  HIGH: {
    styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    label: 'High Confidence',
  },
  MEDIUM: {
    styles: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertCircle,
    label: 'Medium Confidence',
  },
  LOW: {
    styles: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
    label: 'Low Confidence',
  },
} as const satisfies Record<
  ConfidenceLevelType,
  { styles: string; icon: typeof CheckCircle; label: string }
>;

export function ConfidenceBadge({
  level,
  showIcon = false,
  className,
}: ConfidenceBadgeProps) {
  const config = confidenceConfig[level];
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
