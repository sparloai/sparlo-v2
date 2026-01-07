import { cn } from '@kit/ui/utils';

type BadgeVariant =
  | 'track-best-fit'
  | 'track-simpler'
  | 'track-spark'
  | 'confidence-high'
  | 'confidence-medium'
  | 'confidence-low'
  | 'verdict-green'
  | 'verdict-yellow'
  | 'verdict-red'
  | 'likelihood-likely'
  | 'likelihood-possible'
  | 'likelihood-unlikely';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  // Track badges
  'track-best-fit': 'track-badge track-badge--bestfit',
  'track-simpler': 'track-badge track-badge--simpler',
  'track-spark': 'track-badge track-badge--spark',

  // Confidence badges
  'confidence-high': 'confidence-badge confidence-badge--high',
  'confidence-medium': 'confidence-badge confidence-badge--medium',
  'confidence-low': 'confidence-badge confidence-badge--low',

  // Verdict badges
  'verdict-green': 'viability-badge viability-badge--green',
  'verdict-yellow': 'viability-badge viability-badge--yellow',
  'verdict-red': 'viability-badge viability-badge--red',

  // Likelihood badges
  'likelihood-likely': 'likelihood-badge likelihood-badge--likely',
  'likelihood-possible': 'likelihood-badge likelihood-badge--possible',
  'likelihood-unlikely': 'likelihood-badge likelihood-badge--unlikely',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(variantStyles[variant], className)}>{children}</span>
  );
}

// Simple mapping objects - data is Zod-validated upstream, no runtime checks needed
export const TRACK_VARIANTS = {
  best_fit: 'track-best-fit',
  simpler_path: 'track-simpler',
  spark: 'track-spark',
} as const;

export const CONFIDENCE_VARIANTS = {
  HIGH: 'confidence-high',
  MEDIUM: 'confidence-medium',
  LOW: 'confidence-low',
} as const;

export const VERDICT_VARIANTS = {
  GREEN: 'verdict-green',
  YELLOW: 'verdict-yellow',
  RED: 'verdict-red',
} as const;

export const LIKELIHOOD_VARIANTS = {
  Likely: 'likelihood-likely',
  Possible: 'likelihood-possible',
  Unlikely: 'likelihood-unlikely',
} as const;

// Helper functions for backwards compatibility
export function getTrackVariant(
  track: keyof typeof TRACK_VARIANTS,
): BadgeVariant {
  return TRACK_VARIANTS[track] ?? 'track-simpler';
}

export function getConfidenceVariant(
  confidence: keyof typeof CONFIDENCE_VARIANTS,
): BadgeVariant {
  return CONFIDENCE_VARIANTS[confidence] ?? 'confidence-medium';
}

export function getVerdictVariant(
  verdict: keyof typeof VERDICT_VARIANTS,
): BadgeVariant {
  return VERDICT_VARIANTS[verdict] ?? 'verdict-yellow';
}

export function getLikelihoodVariant(
  likelihood: keyof typeof LIKELIHOOD_VARIANTS,
): BadgeVariant {
  return LIKELIHOOD_VARIANTS[likelihood] ?? 'likelihood-possible';
}
