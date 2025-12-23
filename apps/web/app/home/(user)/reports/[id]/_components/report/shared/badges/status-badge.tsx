import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

import { cn } from '@kit/ui/utils';

type StatusType = 'success' | 'warning' | 'error' | 'pending' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

const statusConfig = {
  success: {
    styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    defaultLabel: 'Complete',
  },
  warning: {
    styles: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertCircle,
    defaultLabel: 'Warning',
  },
  error: {
    styles: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
    defaultLabel: 'Error',
  },
  pending: {
    styles: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    icon: Clock,
    defaultLabel: 'Pending',
  },
  info: {
    styles: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: AlertCircle,
    defaultLabel: 'Info',
  },
} as const satisfies Record<
  StatusType,
  { styles: string; icon: typeof CheckCircle; defaultLabel: string }
>;

export function StatusBadge({
  status,
  label,
  showIcon = false,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];
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
      {label || config.defaultLabel}
    </span>
  );
}
