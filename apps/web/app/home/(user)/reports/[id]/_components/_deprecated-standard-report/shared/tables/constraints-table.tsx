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

// Per Jobs Standard: remove headers, add subtle alternating rows
export function ConstraintsTable({
  constraints,
  className,
}: ConstraintsTableProps) {
  if (constraints.length === 0) {
    return null;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[400px] space-y-0">
        {constraints.map((constraint, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-6 px-4 py-4',
              index % 2 === 0
                ? 'bg-zinc-50/50 dark:bg-zinc-800/20'
                : 'bg-white dark:bg-transparent',
            )}
          >
            <div className="w-32 shrink-0">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {constraint.label}
              </span>
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {constraint.value}
              </p>
              {constraint.highlightedTerms &&
                constraint.highlightedTerms.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {constraint.highlightedTerms.map((term, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              {constraint.note && (
                <p className="text-xs text-zinc-500 italic dark:text-zinc-500">
                  {constraint.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
