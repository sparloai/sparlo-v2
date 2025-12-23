import { Sparkles } from 'lucide-react';

import type { InnovationConcept } from '../../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../badges/confidence-badge';
import { BaseCard } from './base-card';

interface InnovationConceptCardProps {
  concept: InnovationConcept;
}

export function InnovationConceptCard({ concept }: InnovationConceptCardProps) {
  return (
    <BaseCard variant="innovation" emphasis="high" className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          Innovation Spark
        </span>
        <ConfidenceBadge level={concept.confidence} />
      </div>

      <h3 className="text-lg font-semibold text-zinc-900">{concept.title}</h3>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-purple-600 uppercase">
            Why Interesting
          </h4>
          <p className="text-sm text-zinc-600">{concept.why_interesting}</p>
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-purple-600 uppercase">
            Why Uncertain
          </h4>
          <p className="text-sm text-zinc-600">{concept.why_uncertain}</p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg bg-white/50 p-3">
        <p className="text-xs text-zinc-500">
          <span className="font-medium">When to pursue:</span>{' '}
          {concept.when_to_pursue}
        </p>
        <p className="text-xs font-medium text-purple-700">
          <span className="font-semibold">Critical validation:</span>{' '}
          {concept.critical_validation}
        </p>
      </div>
    </BaseCard>
  );
}
