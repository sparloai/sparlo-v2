import { cn } from '@kit/ui/utils';

interface Constraint {
  label: string;
  value: string;
  note?: string;
  highlightedTerms?: string[];
}

interface ConstraintsTableProps {
  constraints: Constraint[];
  className?: string;
}

export function ConstraintsTable({
  constraints,
  className,
}: ConstraintsTableProps) {
  if (constraints.length === 0) {
    return null;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[400px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="sticky left-0 bg-white px-4 py-3 text-left font-medium text-zinc-500">
              Constraint
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {constraints.map((constraint, index) => (
            <tr key={index} className="hover:bg-zinc-50">
              <td className="sticky left-0 bg-white px-4 py-3 font-medium text-zinc-900">
                {constraint.label}
              </td>
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <p className="text-zinc-600">{constraint.value}</p>
                  {constraint.highlightedTerms &&
                    constraint.highlightedTerms.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {constraint.highlightedTerms.map((term, i) => (
                          <span
                            key={i}
                            className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700"
                          >
                            {term}
                          </span>
                        ))}
                      </div>
                    )}
                  {constraint.note && (
                    <p className="text-xs text-zinc-500 italic">
                      {constraint.note}
                    </p>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
