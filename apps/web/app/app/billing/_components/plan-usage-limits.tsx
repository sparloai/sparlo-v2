'use client';

import { cn } from '@kit/ui/utils';

interface PlanUsageLimitsProps {
  tokensUsed: number;
  tokensLimit: number;
  periodEnd: string | null;
}

function formatTimeRemaining(periodEnd: string | null): string {
  if (!periodEnd) return '';

  const endDate = new Date(periodEnd);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();

  if (diffMs <= 0) return 'Resetting soon';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `Resets in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
  }
  if (diffHours > 0) {
    return `Resets in ${diffHours} hr ${diffMinutes} min`;
  }
  return `Resets in ${diffMinutes} min`;
}

export function PlanUsageLimits({
  tokensUsed,
  tokensLimit,
  periodEnd,
}: PlanUsageLimitsProps) {
  const usagePercent = Math.min(
    Math.round((tokensUsed / tokensLimit) * 100),
    100,
  );
  const resetText = formatTimeRemaining(periodEnd);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">
        Plan usage limits
      </h3>

      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-700">Current period</p>
            {resetText && <p className="text-sm text-zinc-500">{resetText}</p>}
          </div>
          <span className="text-sm text-zinc-600">{usagePercent}% used</span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              usagePercent >= 90
                ? 'bg-red-500'
                : usagePercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-blue-500',
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
