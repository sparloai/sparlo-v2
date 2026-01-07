'use client';

import { Progress } from '@kit/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import { AppLink } from '~/components/app-link';
import { USAGE_CONSTANTS } from '~/lib/usage/constants';

interface UsageIndicatorProps {
  tokensUsed: number;
  tokensLimit: number;
  reportsCount?: number; // Unused but kept for backwards compatibility
  periodEnd: string;
}

export function UsageIndicator({
  tokensUsed,
  tokensLimit,
  periodEnd,
}: UsageIndicatorProps) {
  const percentage = Math.min((tokensUsed / tokensLimit) * 100, 100);
  const isWarning = percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD;
  const isCritical = percentage >= USAGE_CONSTANTS.CRITICAL_THRESHOLD;
  const isAtLimit = percentage >= USAGE_CONSTANTS.HARD_LIMIT_THRESHOLD;

  // Calculate days remaining from period end
  const periodEndDate = new Date(periodEnd);
  const now = new Date();
  const daysRemaining = Math.ceil(
    (periodEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full cursor-help space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Usage</span>
              <span
                className={
                  isAtLimit
                    ? 'text-destructive font-medium'
                    : isCritical
                      ? 'font-medium text-red-500'
                      : isWarning
                        ? 'font-medium text-amber-500'
                        : 'font-medium'
                }
              >
                {percentage.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={percentage}
              className={
                isAtLimit
                  ? '[&>div]:bg-destructive h-1.5'
                  : isCritical
                    ? 'h-1.5 [&>div]:bg-red-500'
                    : isWarning
                      ? 'h-1.5 [&>div]:bg-amber-500'
                      : 'h-1.5'
              }
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-48">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resets in:</span>
              <span className="font-medium">{daysRemaining} days</span>
            </div>
            <AppLink
              href="/home/billing"
              className="block w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-center text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Upgrade
            </AppLink>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
