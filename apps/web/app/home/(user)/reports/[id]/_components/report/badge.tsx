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
  // Track badges - distinct visual identity per track
  'track-best-fit': 'bg-violet-50 text-violet-700 border border-violet-200',
  'track-simpler': 'bg-gray-100 text-gray-600 border border-gray-200',
  'track-spark': 'bg-amber-50 text-amber-700 border border-amber-200',

  // Confidence badges - semantic colors
  'confidence-high': 'bg-emerald-50 text-emerald-700',
  'confidence-medium': 'bg-amber-50 text-amber-700',
  'confidence-low': 'bg-red-50 text-red-700',

  // Verdict badges - prominent viability indicator
  'verdict-green': 'bg-emerald-100 text-emerald-800 font-semibold',
  'verdict-yellow': 'bg-amber-100 text-amber-800 font-semibold',
  'verdict-red': 'bg-red-100 text-red-800 font-semibold',

  // Likelihood badges
  'likelihood-likely': 'bg-red-50 text-red-600',
  'likelihood-possible': 'bg-amber-50 text-amber-600',
  'likelihood-unlikely': 'bg-gray-50 text-gray-500',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {variant === 'track-spark' && <span className="text-amber-500">✦</span>}
      {children}
    </span>
  );
}

// Helper functions for type-safe variant selection
export function getTrackVariant(track: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    best_fit: 'track-best-fit',
    simpler_path: 'track-simpler',
    spark: 'track-spark',
  };
  return map[track] ?? 'track-simpler';
}

export function getConfidenceVariant(confidence: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    HIGH: 'confidence-high',
    MEDIUM: 'confidence-medium',
    LOW: 'confidence-low',
  };
  return map[confidence] ?? 'confidence-medium';
}

export function getVerdictVariant(verdict: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    GREEN: 'verdict-green',
    YELLOW: 'verdict-yellow',
    RED: 'verdict-red',
  };
  return map[verdict] ?? 'verdict-yellow';
}

export function getLikelihoodVariant(likelihood: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    Likely: 'likelihood-likely',
    Possible: 'likelihood-possible',
    Unlikely: 'likelihood-unlikely',
  };
  return map[likelihood] ?? 'likelihood-possible';
}
