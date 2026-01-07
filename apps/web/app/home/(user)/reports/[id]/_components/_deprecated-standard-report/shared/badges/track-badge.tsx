import { cn } from '@kit/ui/utils';

import type { ConceptTrackType } from '../../../../_lib/schema/sparlo-report.schema';

interface TrackBadgeProps {
  track: ConceptTrackType;
  label: string;
  showIcon?: boolean;
  className?: string;
}

// Per Jobs Standard: muted colors, no borders
const trackConfig = {
  best_fit: {
    styles:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  simpler_path: {
    styles: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  },
  spark: {
    styles:
      'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
  },
} as const satisfies Record<ConceptTrackType, { styles: string }>;

export function TrackBadge({
  track,
  label,
  showIcon: _showIcon = false,
  className,
}: TrackBadgeProps) {
  const config = trackConfig[track];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        config.styles,
        className,
      )}
    >
      {label}
    </span>
  );
}
