import { Sparkles, Target, Zap } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import type { ConceptTrackType } from '../../../../_lib/schema/sparlo-report.schema';

interface TrackBadgeProps {
  track: ConceptTrackType;
  label: string;
  showIcon?: boolean;
  className?: string;
}

const trackConfig = {
  best_fit: {
    styles: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Target,
  },
  simpler_path: {
    styles: 'bg-zinc-50 text-zinc-600 border-zinc-200',
    icon: Zap,
  },
  spark: {
    styles: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Sparkles,
  },
} as const satisfies Record<
  ConceptTrackType,
  { styles: string; icon: typeof Target }
>;

export function TrackBadge({
  track,
  label,
  showIcon = false,
  className,
}: TrackBadgeProps) {
  const config = trackConfig[track];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        config.styles,
        className,
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />}
      {label}
    </span>
  );
}
