'use client';

import Link from 'next/link';

import { ChevronDown } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { useAppWorkspace } from '../../_lib/app-workspace-context';

const WARNING_THRESHOLD = 0.8; // 80%
const CRITICAL_THRESHOLD = 1.0; // 100%

export function UsageIndicator() {
  const { reportsUsed, reportLimit } = useAppWorkspace();
  const percentage = reportLimit > 0 ? reportsUsed / reportLimit : 0;

  const status =
    percentage >= CRITICAL_THRESHOLD
      ? 'critical'
      : percentage >= WARNING_THRESHOLD
        ? 'warning'
        : 'normal';

  const statusColors = {
    normal: 'text-[--text-secondary]',
    warning: 'text-[--status-warning]',
    critical: 'text-[--status-error]',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'group flex items-center gap-1.5 text-sm transition-colors hover:text-[--text-primary]',
            statusColors[status],
          )}
        >
          <span className="hidden lg:inline">
            <Trans
              i18nKey="common:nav.reportsLong"
              values={{ used: reportsUsed, limit: reportLimit }}
            />
          </span>
          <span className="lg:hidden">
            <Trans
              i18nKey="common:nav.reportsShort"
              values={{ used: reportsUsed, limit: reportLimit }}
            />
          </span>
          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <div className="p-3">
          <div className="mb-2 text-sm font-medium">
            <Trans i18nKey="common:nav.usageThisMonth" />
          </div>

          {/* Progress bar */}
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-[--surface-overlay]">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                status === 'critical'
                  ? 'bg-[--status-error]'
                  : status === 'warning'
                    ? 'bg-[--status-warning]'
                    : 'bg-[--accent]',
              )}
              style={{ width: `${Math.min(percentage * 100, 100)}%` }}
            />
          </div>

          <div className="text-xs text-[--text-muted]">
            <Trans
              i18nKey="common:nav.reportsUsed"
              values={{
                used: reportsUsed,
                limit: reportLimit,
                percent: Math.round(percentage * 100),
              }}
            />
          </div>
        </div>

        <DropdownMenuItem asChild>
          <Link href="/home/settings/billing" className="cursor-pointer">
            <Trans i18nKey="common:nav.upgradePlan" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
