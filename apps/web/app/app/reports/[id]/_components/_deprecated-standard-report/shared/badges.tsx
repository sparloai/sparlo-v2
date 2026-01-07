import { cn } from '@kit/ui/utils';

import type {
  ConceptTrackType,
  ConfidenceLevelType,
  LikelihoodColorType,
  ViabilityVerdictType,
} from '../../../_lib/schema/sparlo-report.schema';

// ============================================================================
// CONFIDENCE BADGE
// ============================================================================

interface ConfidenceBadgeProps {
  level: ConfidenceLevelType;
  className?: string;
}

const confidenceStyles = {
  HIGH: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
  LOW: 'bg-zinc-100 text-zinc-600 border-zinc-200',
} as const satisfies Record<ConfidenceLevelType, string>;

export function ConfidenceBadge({ level, className }: ConfidenceBadgeProps) {
  const displayLevel = level.charAt(0) + level.slice(1).toLowerCase();
  return (
    <span
      className={cn(
        'rounded border px-2.5 py-1 text-[10px] font-semibold',
        confidenceStyles[level],
        className,
      )}
    >
      {displayLevel}
    </span>
  );
}

// ============================================================================
// VIABILITY BADGE
// ============================================================================

interface ViabilityBadgeProps {
  viability: ViabilityVerdictType;
  label?: string;
  className?: string;
}

const viabilityStyles = {
  GREEN: {
    container: 'bg-emerald-50 border-emerald-100',
    dot: 'bg-emerald-600',
    text: 'text-emerald-700',
  },
  YELLOW: {
    container: 'bg-amber-50 border-amber-100',
    dot: 'bg-amber-600',
    text: 'text-amber-700',
  },
  RED: {
    container: 'bg-zinc-100 border-zinc-200',
    dot: 'bg-zinc-500',
    text: 'text-zinc-600',
  },
} as const satisfies Record<
  ViabilityVerdictType,
  { container: string; dot: string; text: string }
>;

export function ViabilityBadge({
  viability,
  label,
  className,
}: ViabilityBadgeProps) {
  const style = viabilityStyles[viability];

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border px-2.5 py-1',
        style.container,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      <span className={cn('text-[10px] font-semibold', style.text)}>
        {label || `Viability: ${viability.toLowerCase()}`}
      </span>
    </div>
  );
}

// ============================================================================
// TRACK BADGE
// ============================================================================

interface TrackBadgeProps {
  track: ConceptTrackType;
  label: string;
  className?: string;
}

const trackStyles = {
  best_fit: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  simpler_path: 'bg-white text-zinc-600 border-zinc-200',
  spark: 'bg-purple-100 text-purple-700 border-purple-200',
} as const satisfies Record<ConceptTrackType, string>;

export function TrackBadge({ track, label, className }: TrackBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-[10px] font-semibold',
        trackStyles[track],
        className,
      )}
    >
      {label}
    </span>
  );
}

// ============================================================================
// LIKELIHOOD BADGE (for risks)
// ============================================================================

interface LikelihoodBadgeProps {
  color?: LikelihoodColorType;
  label: string;
  className?: string;
}

const likelihoodStyles = {
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  gray: 'bg-zinc-50 text-zinc-600 border-zinc-200',
} as const satisfies Record<LikelihoodColorType, string>;

export function LikelihoodBadge({
  color = 'gray',
  label,
  className,
}: LikelihoodBadgeProps) {
  return (
    <span
      className={cn(
        'rounded border px-2.5 py-1 text-[10px] font-semibold',
        likelihoodStyles[color],
        className,
      )}
    >
      {label}
    </span>
  );
}
