import { Lightbulb } from 'lucide-react';

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
          className="flex gap-3 rounded-lg border border-zinc-100 bg-white p-4 transition-colors hover:border-zinc-200"
        >
          {numbered ? (
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
              {index + 1}
            </span>
          ) : (
            <Lightbulb
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
              strokeWidth={1.5}
            />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-medium text-zinc-900">{insight.headline}</p>
            {insight.explanation && (
              <p className="text-sm text-zinc-600">{insight.explanation}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
