'use client';

import { FileText, MessageSquare, Zap } from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';
import { cn } from '@kit/ui/utils';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';

interface UsageCardProps {
  tokensUsed: number;
  tokensLimit: number;
  reportsCount: number;
  chatTokensUsed: number;
  periodEnd: string | null;
  planName: string;
}

export function UsageCard({
  tokensUsed,
  tokensLimit,
  reportsCount,
  chatTokensUsed,
  periodEnd,
  planName,
}: UsageCardProps) {
  const percentage = tokensLimit > 0 ? (tokensUsed / tokensLimit) * 100 : 0;
  const remaining = Math.max(0, tokensLimit - tokensUsed);
  const estimatedReportsLeft = Math.floor(
    remaining / USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
  );

  const isWarning = percentage >= USAGE_CONSTANTS.WARNING_THRESHOLD;
  const isCritical = percentage >= USAGE_CONSTANTS.CRITICAL_THRESHOLD;

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) {
      return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
      return `${(tokens / 1_000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!periodEnd) return null;
    const end = new Date(periodEnd);
    const now = new Date();
    return Math.max(
      0,
      Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Usage This Month</CardTitle>
          <Badge variant="secondary" className="font-medium">
            {planName}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tokens used</span>
            <span className="font-medium">
              {formatTokens(tokensUsed)} / {formatTokens(tokensLimit)}
            </span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className={cn(
              'h-2',
              isCritical
                ? '[&>div]:bg-red-500'
                : isWarning
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-primary',
            )}
          />
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                isCritical
                  ? 'font-medium text-red-500'
                  : isWarning
                    ? 'font-medium text-amber-500'
                    : 'text-muted-foreground',
              )}
            >
              {percentage.toFixed(0)}% used
            </span>
            {daysRemaining !== null && (
              <span className="text-muted-foreground">
                Resets in {daysRemaining} days
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">{reportsCount}</span>
            <span className="text-muted-foreground text-xs">Reports</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">
              {formatTokens(chatTokensUsed)}
            </span>
            <span className="text-muted-foreground text-xs">Chat tokens</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                estimatedReportsLeft <= 2
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-green-500/10 text-green-500',
              )}
            >
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold">
              ~{estimatedReportsLeft}
            </span>
            <span className="text-muted-foreground text-xs">Reports left</span>
          </div>
        </div>

        {periodEnd && (
          <div className="text-muted-foreground border-t pt-4 text-center text-xs">
            Next billing date: {formatDate(periodEnd)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
