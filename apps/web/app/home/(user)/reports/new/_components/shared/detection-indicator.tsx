'use client';

import { cn } from '@kit/ui/utils';

/**
 * Shared detection indicator component for analysis forms.
 * Shows a dot that fills when a pattern is detected in the input.
 */

interface DetectionIndicatorProps {
  label: string;
  detected: boolean;
}

export function DetectionIndicator({
  label,
  detected,
}: DetectionIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'h-1.5 w-1.5 rounded-full transition-colors duration-300',
          detected ? 'bg-zinc-900' : 'bg-zinc-300',
        )}
      />
      <span
        className={cn(
          'text-[13px] tracking-[-0.02em] transition-colors duration-300',
          detected ? 'text-zinc-700' : 'text-zinc-400',
        )}
      >
        {label}
      </span>
    </div>
  );
}
