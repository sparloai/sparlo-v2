import { cn } from '@kit/ui/utils';

type CardVariant = 'default' | 'lead' | 'innovation' | 'warning' | 'success';
type CardEmphasis = 'high' | 'subtle';

interface BaseCardProps {
  variant?: CardVariant;
  emphasis?: CardEmphasis;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    subtle: 'bg-white border border-zinc-200',
    high: 'bg-white border-2 border-zinc-300',
  },
  lead: {
    subtle: 'bg-emerald-50/30 border border-emerald-100',
    high: 'bg-emerald-50/30 border-2 border-emerald-200',
  },
  innovation: {
    subtle: 'bg-purple-50/30 border border-purple-100',
    high: 'bg-purple-50/30 border-2 border-purple-200',
  },
  warning: {
    subtle: 'bg-amber-50/30 border border-amber-100',
    high: 'bg-amber-50/30 border-2 border-amber-200',
  },
  success: {
    subtle: 'bg-emerald-50/30 border border-emerald-100',
    high: 'bg-emerald-50/30 border-2 border-emerald-200',
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
        'space-y-4 rounded-xl p-6',
        variantStyles[variant][emphasis],
        className,
      )}
    >
      {children}
    </div>
  );
}
