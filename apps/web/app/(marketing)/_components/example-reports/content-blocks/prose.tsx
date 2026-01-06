import { cn } from '@kit/ui/utils';

interface ProseProps {
  children: React.ReactNode;
  className?: string;
}

export function Prose({ children, className }: ProseProps) {
  return (
    <p className={cn('text-[14px] leading-relaxed text-zinc-700', className)}>
      {children}
    </p>
  );
}
