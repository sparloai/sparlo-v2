import { Lightbulb } from 'lucide-react';

import { BaseCard } from './base-card';

interface InsightCardProps {
  headline: string;
  explanation: string;
  variant?: 'default' | 'featured';
}

export function InsightCard({
  headline,
  explanation,
  variant = 'default',
}: InsightCardProps) {
  if (variant === 'featured') {
    return (
      <div className="space-y-3 rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100/50 p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" strokeWidth={1.5} />
          <h3 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
            First Principles Insight
          </h3>
        </div>
        <p className="text-lg font-semibold text-zinc-900">{headline}</p>
        <p className="text-base leading-relaxed text-zinc-600">{explanation}</p>
      </div>
    );
  }

  return (
    <BaseCard variant="default" emphasis="subtle">
      <div className="flex items-start gap-3">
        <Lightbulb
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
          strokeWidth={1.5}
        />
        <div className="space-y-1">
          <p className="font-medium text-zinc-900">{headline}</p>
          <p className="text-sm text-zinc-600">{explanation}</p>
        </div>
      </div>
    </BaseCard>
  );
}
