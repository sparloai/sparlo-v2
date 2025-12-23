import { cn } from '@kit/ui/utils';

interface BulletListProps {
  items: string[];
  variant?: 'default' | 'muted';
  className?: string;
}

export function BulletList({
  items,
  variant = 'default',
  className,
}: BulletListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={cn('space-y-2', className)}>
      {items.map((item, index) => (
        <li
          key={index}
          className={cn(
            'flex items-start gap-2 text-sm',
            variant === 'muted' ? 'text-zinc-500' : 'text-zinc-600',
          )}
        >
          <span
            className={cn(
              'mt-2 h-1.5 w-1.5 shrink-0 rounded-full',
              variant === 'muted' ? 'bg-zinc-300' : 'bg-zinc-400',
            )}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
