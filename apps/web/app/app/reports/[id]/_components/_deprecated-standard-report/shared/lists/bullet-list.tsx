import { cn } from '@kit/ui/utils';

interface BulletListProps {
  items: string[];
  variant?: 'default' | 'muted';
  className?: string;
}

// Per Jobs Standard: custom-styled bullet elements (em-dash style)
export function BulletList({
  items,
  variant = 'default',
  className,
}: BulletListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cn(
            'flex items-start gap-3 text-sm',
            variant === 'muted'
              ? 'text-zinc-500 dark:text-zinc-500'
              : 'text-zinc-600 dark:text-zinc-400',
          )}
        >
          <span
            className={cn(
              'mt-2.5 h-px w-3 shrink-0',
              variant === 'muted'
                ? 'bg-zinc-300 dark:bg-zinc-600'
                : 'bg-zinc-400 dark:bg-zinc-500',
            )}
          />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
