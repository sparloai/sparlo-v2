'use client';

import { ArrowRight, Clock, DollarSign, Target, Zap } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import type { ConceptRecommendation } from '../../_lib/types/report-data.types';
import { ConfidenceBadge } from './confidence-badge';

interface RecommendationCardProps {
  recommendation: ConceptRecommendation;
  type: 'primary' | 'fallback';
}

export function RecommendationCard({
  recommendation,
  type,
}: RecommendationCardProps) {
  const isPrimary = type === 'primary';

  return (
    <div
      className={cn(
        'rounded-xl border p-6',
        isPrimary
          ? 'border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/20'
          : 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/50',
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            {isPrimary ? (
              <Target className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            ) : (
              <ArrowRight className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            )}
            <span
              className={cn(
                'text-xs font-medium tracking-wider uppercase',
                isPrimary
                  ? 'text-violet-600 dark:text-violet-400'
                  : 'text-zinc-500 dark:text-zinc-400',
              )}
            >
              {isPrimary ? 'Primary Recommendation' : 'Fallback Strategy'}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            {recommendation.title}
          </h3>
        </div>
        <ConfidenceBadge level={recommendation.confidence_level} />
      </div>

      {recommendation.executive_summary && (
        <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {recommendation.executive_summary}
        </p>
      )}

      {recommendation.why_it_wins && (
        <div className="mb-4 rounded-lg bg-white/60 p-4 dark:bg-zinc-800/60">
          <div className="mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-zinc-900 dark:text-white">
              Why This Wins
            </span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {recommendation.why_it_wins}
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {recommendation.estimated_timeline && (
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Timeline
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                {recommendation.estimated_timeline}
              </p>
            </div>
          </div>
        )}
        {recommendation.estimated_investment && (
          <div className="flex items-start gap-2">
            <DollarSign className="mt-0.5 h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Investment
              </span>
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                {recommendation.estimated_investment}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
