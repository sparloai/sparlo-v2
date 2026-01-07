import { cn } from '@kit/ui/utils';

type StatusType = 'success' | 'warning' | 'error' | 'pending' | 'info';

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

// Per Jobs Standard: muted colors, no alarm tones, no borders
const statusConfig = {
  success: {
    styles:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    defaultLabel: 'Complete',
  },
  warning: {
    styles:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    defaultLabel: 'Warning',
  },
  error: {
    styles: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    defaultLabel: 'Error',
  },
  pending: {
    styles: 'bg-zinc-50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400',
    defaultLabel: 'Pending',
  },
  info: {
    styles: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    defaultLabel: 'Info',
  },
} as const satisfies Record<
  StatusType,
  { styles: string; defaultLabel: string }
>;

export function StatusBadge({
  status,
  label,
  showIcon: _showIcon = false,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        config.styles,
        className,
      )}
    >
      {label || config.defaultLabel}
    </span>
  );
}
