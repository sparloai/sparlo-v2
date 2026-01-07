import { cn } from '@kit/ui/utils';

import type { ConfidenceLevelType } from '../../../../_lib/schema/sparlo-report.schema';
import { ConfidenceBadge } from '../badges/confidence-badge';

interface ComparisonRow {
  id: string;
  title: string;
  keyMetric: string;
  confidence: ConfidenceLevelType;
  capital: string;
  timeline: string;
  keyRisk: string;
}

interface ComparisonTableProps {
  rows: ComparisonRow[];
  insight?: string;
  className?: string;
}

// Per Jobs Standard: remove header backgrounds, add subtle alternating rows
export function ComparisonTable({
  rows,
  insight,
  className,
}: ComparisonTableProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-700">
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                Concept
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                Key Metric
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                Confidence
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                Capital
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                Timeline
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wide text-zinc-500 dark:text-zinc-400">
                Key Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  index % 2 === 0
                    ? 'bg-zinc-50/50 dark:bg-zinc-800/20'
                    : 'bg-white dark:bg-transparent',
                )}
              >
                <td className="px-4 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {row.title}
                </td>
                <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
                  {row.keyMetric}
                </td>
                <td className="px-4 py-4">
                  <ConfidenceBadge level={row.confidence} />
                </td>
                <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
                  {row.capital}
                </td>
                <td className="px-4 py-4 text-zinc-600 dark:text-zinc-400">
                  {row.timeline}
                </td>
                <td className="px-4 py-4 text-xs text-zinc-500 dark:text-zinc-500">
                  {row.keyRisk}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {insight && (
        <p className="text-sm text-zinc-600 italic dark:text-zinc-400">
          {insight}
        </p>
      )}
    </div>
  );
}
