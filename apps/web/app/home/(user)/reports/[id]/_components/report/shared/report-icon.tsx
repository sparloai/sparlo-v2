import type { LucideIcon } from 'lucide-react';

import { cn } from '@kit/ui/utils';

interface ReportIconProps {
  icon: LucideIcon;
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeStyles = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const;

export function ReportIcon({
  icon: Icon,
  className,
  label,
  size = 'md',
}: ReportIconProps) {
  return (
    <Icon
      className={cn(sizeStyles[size], className)}
      strokeWidth={1.5}
      aria-label={label}
      aria-hidden={!label}
    />
  );
}
