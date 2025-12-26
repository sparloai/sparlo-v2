import { cn } from '@kit/ui/utils';

interface FeatureListProps {
  features: string[];
  variant?: 'default' | 'compact';
  className?: string;
}

// Per Jobs Standard: subtle custom-styled elements (checkmark as text)
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
    <ul className={cn('space-y-2.5', className)}>
      {features.map((feature, index) => (
        <li
          key={index}
          className={cn(
            'flex items-start gap-3',
            isCompact ? 'text-sm' : 'text-base',
          )}
        >
          <span
            className={cn(
              'shrink-0 font-medium text-emerald-600 dark:text-emerald-500',
              isCompact ? 'mt-0.5 text-xs' : 'mt-0.5 text-sm',
            )}
          >
            +
          </span>
          <span className="leading-relaxed text-zinc-700 dark:text-zinc-300">
            {feature}
          </span>
        </li>
      ))}
    </ul>
  );
}
