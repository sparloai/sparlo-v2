import { Check } from 'lucide-react';

import { cn } from '@kit/ui/utils';

interface FeatureListProps {
  features: string[];
  variant?: 'default' | 'compact';
  className?: string;
}

export function FeatureList({
  features,
  variant = 'default',
  className,
}: FeatureListProps) {
  if (features.length === 0) {
    return null;
  }

  const isCompact = variant === 'compact';

  return (
    <ul className={cn('space-y-2', className)}>
      {features.map((feature, index) => (
        <li
          key={index}
          className={cn(
            'flex items-start gap-2',
            isCompact ? 'text-sm' : 'text-base',
          )}
        >
          <span
            className={cn(
              'mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-emerald-100',
              isCompact ? 'h-4 w-4' : 'h-5 w-5',
            )}
          >
            <Check
              className={cn(
                'text-emerald-600',
                isCompact ? 'h-2.5 w-2.5' : 'h-3 w-3',
              )}
              strokeWidth={2.5}
            />
          </span>
          <span className="text-zinc-700">{feature}</span>
        </li>
      ))}
    </ul>
  );
}
