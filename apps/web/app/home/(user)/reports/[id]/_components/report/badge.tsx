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
  // Track badges - using semantic tokens
  'track-best-fit':
    'bg-[--accent-muted] text-[--accent] border border-[--accent]/20',
  'track-simpler':
    'bg-[--status-success]/15 text-[--status-success] border border-[--status-success]/20',
  'track-spark':
    'bg-[--status-warning]/15 text-[--status-warning] border border-[--status-warning]/20',

  // Confidence badges - semantic colors
  'confidence-high': 'bg-[--status-success]/15 text-[--status-success]',
  'confidence-medium': 'bg-[--status-warning]/15 text-[--status-warning]',
  'confidence-low': 'bg-[--status-error]/15 text-[--status-error]',

  // Verdict badges - prominent viability indicator
  'verdict-green':
    'bg-[--status-success]/20 text-[--status-success] font-semibold',
  'verdict-yellow':
    'bg-[--status-warning]/20 text-[--status-warning] font-semibold',
  'verdict-red': 'bg-[--status-error]/20 text-[--status-error] font-semibold',

  // Likelihood badges
  'likelihood-likely': 'bg-[--status-error]/15 text-[--status-error]',
  'likelihood-possible': 'bg-[--status-warning]/15 text-[--status-warning]',
  'likelihood-unlikely': 'bg-[--text-muted]/15 text-[--text-muted]',
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
      {variant === 'track-spark' && (
        <span className="text-[--status-warning]">✦</span>
      )}
      {children}
    </span>
  );
}

// Valid input values (whitelist to prevent prototype pollution)
const VALID_TRACKS = ['best_fit', 'simpler_path', 'spark'] as const;
const VALID_CONFIDENCE = ['HIGH', 'MEDIUM', 'LOW'] as const;
const VALID_VERDICT = ['GREEN', 'YELLOW', 'RED'] as const;
const VALID_LIKELIHOOD = ['Likely', 'Possible', 'Unlikely'] as const;

type Track = (typeof VALID_TRACKS)[number];
type Confidence = (typeof VALID_CONFIDENCE)[number];
type Verdict = (typeof VALID_VERDICT)[number];
type Likelihood = (typeof VALID_LIKELIHOOD)[number];

// Helper functions for type-safe variant selection
export function getTrackVariant(track: string): BadgeVariant {
  if (!VALID_TRACKS.includes(track as Track)) {
    return 'track-simpler';
  }
  const map: Record<Track, BadgeVariant> = {
    best_fit: 'track-best-fit',
    simpler_path: 'track-simpler',
    spark: 'track-spark',
  };
  return map[track as Track];
}

export function getConfidenceVariant(confidence: string): BadgeVariant {
  if (!VALID_CONFIDENCE.includes(confidence as Confidence)) {
    return 'confidence-medium';
  }
  const map: Record<Confidence, BadgeVariant> = {
    HIGH: 'confidence-high',
    MEDIUM: 'confidence-medium',
    LOW: 'confidence-low',
  };
  return map[confidence as Confidence];
}

export function getVerdictVariant(verdict: string): BadgeVariant {
  if (!VALID_VERDICT.includes(verdict as Verdict)) {
    return 'verdict-yellow';
  }
  const map: Record<Verdict, BadgeVariant> = {
    GREEN: 'verdict-green',
    YELLOW: 'verdict-yellow',
    RED: 'verdict-red',
  };
  return map[verdict as Verdict];
}

export function getLikelihoodVariant(likelihood: string): BadgeVariant {
  if (!VALID_LIKELIHOOD.includes(likelihood as Likelihood)) {
    return 'likelihood-possible';
  }
  const map: Record<Likelihood, BadgeVariant> = {
    Likely: 'likelihood-likely',
    Possible: 'likelihood-possible',
    Unlikely: 'likelihood-unlikely',
  };
  return map[likelihood as Likelihood];
}
