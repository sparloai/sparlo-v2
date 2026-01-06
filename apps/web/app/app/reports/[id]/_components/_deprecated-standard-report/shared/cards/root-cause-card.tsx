import type { ConfidenceLevelType } from '../../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../badges/confidence-badge';
import { BaseCard } from './base-card';

interface RootCauseCardProps {
  id: number;
  name: string;
  confidence: ConfidenceLevelType;
  explanation: string;
}

// Per Jobs Standard: consistent spacing, muted colors
export function RootCauseCard({
  id,
  name,
  confidence,
  explanation,
}: RootCauseCardProps) {
  return (
    <BaseCard variant="default" emphasis="subtle" className="flex gap-5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
        {id}
      </span>
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
          <ConfidenceBadge level={confidence} />
        </div>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {explanation}
        </p>
      </div>
    </BaseCard>
  );
}
