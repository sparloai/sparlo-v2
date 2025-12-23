import type { ConfidenceLevelType } from '../../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../badges/confidence-badge';
import { BaseCard } from './base-card';

interface RootCauseCardProps {
  id: number;
  name: string;
  confidence: ConfidenceLevelType;
  explanation: string;
}

export function RootCauseCard({
  id,
  name,
  confidence,
  explanation,
}: RootCauseCardProps) {
  return (
    <BaseCard
      variant="default"
      emphasis="subtle"
      className="flex gap-4 transition-colors hover:border-zinc-300"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600">
        {id}
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-zinc-900">{name}</span>
          <ConfidenceBadge level={confidence} />
        </div>
        <p className="text-sm leading-relaxed text-zinc-600">{explanation}</p>
      </div>
    </BaseCard>
  );
}
