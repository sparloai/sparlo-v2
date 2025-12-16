'use client';

import Link from 'next/link';

import { Sparkles } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Progress } from '@kit/ui/progress';
import { cn } from '@kit/ui/utils';

interface UsageIndicatorProps {
  used: number;
  limit: number;
  billingPath?: string;
  className?: string;
}

export function UsageIndicator({
  used,
  limit,
  billingPath = '/home/billing',
  className,
}: UsageIndicatorProps) {
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);
  const isNearLimit = percentage >= 80;
  const isAtLimit = used >= limit;

  return (
    <div
      className={cn(
        'border-border bg-card rounded-lg border p-3 group-data-[minimized=true]/sidebar:hidden',
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">
          Reports
        </span>
        <span
          className={cn(
            'text-xs font-semibold tabular-nums',
            isAtLimit
              ? 'text-destructive'
              : isNearLimit
                ? 'text-amber-600 dark:text-amber-500'
                : 'text-foreground',
          )}
        >
          {used} / {limit}
        </span>
      </div>

      <Progress
        value={percentage}
        className={cn(
          'mb-3 h-1.5',
          isAtLimit && '[&>div]:bg-destructive',
          isNearLimit && !isAtLimit && '[&>div]:bg-amber-500',
        )}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">
          {isAtLimit ? (
            'Limit reached'
          ) : (
            <>
              {remaining} report{remaining !== 1 ? 's' : ''} left
            </>
          )}
        </span>

        <Button
          asChild
          variant={isNearLimit ? 'default' : 'outline'}
          size="sm"
          className="h-7 gap-1.5 px-2.5 text-xs"
        >
          <Link href={billingPath}>
            <Sparkles className="h-3 w-3" />
            Upgrade
          </Link>
        </Button>
      </div>
    </div>
  );
}
