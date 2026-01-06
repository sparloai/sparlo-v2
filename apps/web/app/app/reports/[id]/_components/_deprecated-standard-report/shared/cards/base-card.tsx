import { cn } from '@kit/ui/utils';

type CardVariant = 'default' | 'lead' | 'innovation' | 'warning' | 'success';
type CardEmphasis = 'high' | 'subtle';

interface BaseCardProps {
  variant?: CardVariant;
  emphasis?: CardEmphasis;
  children: React.ReactNode;
  className?: string;
}

// Per Jobs Standard: subtle shadows instead of borders
const variantStyles = {
  default: {
    subtle:
      'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:bg-zinc-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
    high: 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] dark:bg-zinc-900 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]',
  },
  lead: {
    subtle:
      'bg-emerald-50/40 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:bg-emerald-950/30',
    high: 'bg-emerald-50/50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] dark:bg-emerald-950/40',
  },
  innovation: {
    subtle:
      'bg-violet-50/40 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:bg-violet-950/30',
    high: 'bg-violet-50/50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] dark:bg-violet-950/40',
  },
  warning: {
    subtle:
      'bg-amber-50/40 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:bg-amber-950/30',
    high: 'bg-amber-50/50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] dark:bg-amber-950/40',
  },
  success: {
    subtle:
      'bg-emerald-50/40 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:bg-emerald-950/30',
    high: 'bg-emerald-50/50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] dark:bg-emerald-950/40',
  },
} as const satisfies Record<CardVariant, Record<CardEmphasis, string>>;

export function BaseCard({
  variant = 'default',
  emphasis = 'subtle',
  children,
  className,
}: BaseCardProps) {
  return (
    <div
      className={cn(
        'space-y-5 rounded-xl p-8',
        variantStyles[variant][emphasis],
        className,
      )}
    >
      {children}
    </div>
  );
}
