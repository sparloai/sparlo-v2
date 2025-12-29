import { BaseCard } from './base-card';

interface InsightCardProps {
  headline: string;
  explanation: string;
  variant?: 'default' | 'featured';
}

// Per Jobs Standard: subtle shadows, no borders or gradients, no icons
export function InsightCard({
  headline,
  explanation,
  variant = 'default',
}: InsightCardProps) {
  if (variant === 'featured') {
    return (
      <div className="space-y-4 rounded-xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.06)] dark:bg-zinc-900 dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
        <span className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
          First principles insight
        </span>
        <p className="text-xl leading-snug font-semibold text-zinc-900 dark:text-zinc-100">
          {headline}
        </p>
        <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          {explanation}
        </p>
      </div>
    );
  }

  return (
    <BaseCard variant="default" emphasis="subtle">
      <div className="space-y-2">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {headline}
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {explanation}
        </p>
      </div>
    </BaseCard>
  );
}
