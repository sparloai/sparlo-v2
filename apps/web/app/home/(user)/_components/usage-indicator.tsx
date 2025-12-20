'use client';

import { Progress } from '@kit/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';

interface UsageIndicatorProps {
  tokensUsed: number;
  tokensLimit: number;
  reportsCount: number;
  periodEnd: string;
}

export function UsageIndicator({
  tokensUsed,
  tokensLimit,
  reportsCount,
  periodEnd,
}: UsageIndicatorProps) {
  const percentage = Math.min((tokensUsed / tokensLimit) * 100, 100);
  const isWarning = percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD;
  const isCritical = percentage >= USAGE_CONSTANTS.CRITICAL_THRESHOLD;
  const isAtLimit = percentage >= USAGE_CONSTANTS.HARD_LIMIT_THRESHOLD;

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

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
        <TooltipContent side="bottom" className="w-64">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tokens used:</span>
              <span className="font-medium">
                {formatTokens(tokensUsed)} / {formatTokens(tokensLimit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reports created:</span>
              <span className="font-medium">{reportsCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Resets in:</span>
              <span className="font-medium">{daysRemaining} days</span>
            </div>
            {isWarning && (
              <div className="text-muted-foreground border-t pt-2 text-xs">
                {isAtLimit
                  ? 'Upgrade your plan to continue generating reports.'
                  : isCritical
                    ? 'Almost at your limit. Upgrade soon.'
                    : 'Running low on tokens. Consider upgrading.'}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
