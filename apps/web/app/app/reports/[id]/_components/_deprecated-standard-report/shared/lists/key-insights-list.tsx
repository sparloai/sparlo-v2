import { cn } from '@kit/ui/utils';

interface Insight {
  headline: string;
  explanation?: string;
}

interface KeyInsightsListProps {
  insights: Insight[];
  numbered?: boolean;
  className?: string;
}

// Per Jobs Standard: subtle shadows, muted colors, no heavy borders
export function KeyInsightsList({
  insights,
  numbered = true,
  className,
}: KeyInsightsListProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {insights.map((insight, index) => (
        <div
          key={index}
          className="flex gap-4 rounded-xl bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] dark:bg-zinc-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
        >
          {numbered ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {index + 1}
            </span>
          ) : (
            <span className="mt-0.5 shrink-0 text-sm font-medium text-zinc-400 dark:text-zinc-500">
              •
            </span>
          )}
          <div className="flex-1 space-y-1.5">
            <p className="font-medium text-zinc-900 dark:text-zinc-100">
              {insight.headline}
            </p>
            {insight.explanation && (
              <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {insight.explanation}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
