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
      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50">
              <th className="sticky left-0 bg-zinc-50 px-4 py-3 text-left font-semibold text-zinc-700">
                Concept
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                Key Metric
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                Confidence
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                Capital
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                Timeline
              </th>
              <th className="px-4 py-3 text-left font-semibold text-zinc-700">
                Key Risk
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-50">
                <td className="sticky left-0 bg-white px-4 py-3 font-medium text-zinc-900">
                  {row.title}
                </td>
                <td className="px-4 py-3 text-zinc-600">{row.keyMetric}</td>
                <td className="px-4 py-3">
                  <ConfidenceBadge level={row.confidence} />
                </td>
                <td className="px-4 py-3 text-zinc-600">{row.capital}</td>
                <td className="px-4 py-3 text-zinc-600">{row.timeline}</td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {row.keyRisk}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {insight && <p className="text-sm text-zinc-600 italic">{insight}</p>}
    </div>
  );
}
