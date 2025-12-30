import type { InnovationConcept } from '../../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../badges/confidence-badge';
import { BaseCard } from './base-card';

interface InnovationConceptCardProps {
  concept: InnovationConcept;
}

// Per Jobs Standard: muted colors, no icons in badges, consistent spacing
export function InnovationConceptCard({ concept }: InnovationConceptCardProps) {
  return (
    <BaseCard variant="innovation" emphasis="high" className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/30 dark:text-violet-400">
          Innovation Spark
        </span>
        <ConfidenceBadge level={concept.confidence} />
      </div>

      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        {concept.title}
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h4 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Why interesting
          </h4>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {concept.why_interesting}
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
            Why uncertain
          </h4>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {concept.why_uncertain}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg bg-zinc-50/50 p-4 dark:bg-zinc-800/30">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            When to pursue:
          </span>{' '}
          {concept.when_to_pursue}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Critical validation:
          </span>{' '}
          {concept.critical_validation}
        </p>
      </div>
    </BaseCard>
  );
}
