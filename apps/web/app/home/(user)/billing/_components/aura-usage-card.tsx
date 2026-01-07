'use client';

import { BarChart3, FileText, MessageSquare, Zap } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import { USAGE_CONSTANTS } from '~/lib/usage/constants';
import { formatTokens } from '~/lib/usage/utils';

interface TeamMemberUsage {
  userId: string;
  userName: string;
  reportsCount: number;
  isCurrentMember: boolean;
}

interface AuraUsageCardProps {
  tokensUsed: number;
  tokensLimit: number;
  reportsCount: number;
  chatTokensUsed: number;
  periodEnd: string | null;
  planName: string;
  /** Optional per-member breakdown for team accounts */
  memberUsage?: TeamMemberUsage[];
}

export function AuraUsageCard({
  tokensUsed,
  tokensLimit,
  reportsCount,
  chatTokensUsed,
  periodEnd,
  planName,
  memberUsage,
}: AuraUsageCardProps) {
  const usagePercent = Math.min((tokensUsed / tokensLimit) * 100, 100);
  const formattedTokensUsed = (tokensUsed / 1_000_000).toFixed(1);
  const formattedTokensLimit = (tokensLimit / 1_000_000).toFixed(1);
  const remaining = Math.max(0, tokensLimit - tokensUsed);
  const estimatedReportsLeft = Math.floor(
    remaining / USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
  );

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50/50 p-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-zinc-950" />
          <h3 className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
            Usage This Period
          </h3>
        </div>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-xs font-medium tracking-widest text-zinc-700 uppercase">
          {planName}
        </span>
      </div>

      {/* Card Body */}
      <div className="space-y-6 p-6 sm:p-8">
        {/* Token Usage Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
              Token Usage
            </span>
            <span className="text-sm text-zinc-600">
              {formattedTokensUsed}M / {formattedTokensLimit}M
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                usagePercent >= USAGE_CONSTANTS.CRITICAL_THRESHOLD
                  ? 'bg-red-500'
                  : usagePercent >= USAGE_CONSTANTS.WARNING_THRESHOLD
                    ? 'bg-amber-500'
                    : 'bg-zinc-950',
              )}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span
              className={cn(
                usagePercent >= USAGE_CONSTANTS.CRITICAL_THRESHOLD
                  ? 'font-medium text-red-600'
                  : usagePercent >= USAGE_CONSTANTS.WARNING_THRESHOLD
                    ? 'font-medium text-amber-600'
                    : '',
              )}
            >
              {usagePercent.toFixed(0)}% used
            </span>
            {periodEnd && (
              <span>
                Resets{' '}
                {new Date(periodEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-zinc-200 pt-4">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-950">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-zinc-950">
              {reportsCount}
            </span>
            <span className="text-xs text-zinc-500">Reports</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-950">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-zinc-950">
              {formatTokens(chatTokensUsed)}
            </span>
            <span className="text-xs text-zinc-500">Chat tokens</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                estimatedReportsLeft <= 2
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-emerald-100 text-emerald-600',
              )}
            >
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-zinc-950">
              ~{estimatedReportsLeft}
            </span>
            <span className="text-xs text-zinc-500">Reports left</span>
          </div>
        </div>

        {/* Member Usage Breakdown (for team accounts) */}
        {memberUsage && memberUsage.length > 0 && (
          <div className="border-t border-zinc-200 pt-6">
            <h4 className="mb-4 font-mono text-xs font-bold tracking-widest text-zinc-600 uppercase">
              Reports by Member
            </h4>
            <div className="space-y-3">
              {memberUsage.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-700">
                      {member.userName}
                    </span>
                    {!member.isCurrentMember && (
                      <span className="text-xs text-zinc-400">(removed)</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-zinc-900">
                    {member.reportsCount}{' '}
                    {member.reportsCount === 1 ? 'report' : 'reports'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {memberUsage && memberUsage.length === 0 && (
          <div className="border-t border-zinc-200 pt-6">
            <p className="text-sm text-zinc-400 italic">
              No reports generated this period
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
