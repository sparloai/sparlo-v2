'use client';

import { memo } from 'react';

import Link from 'next/link';

import { cn } from '@kit/ui/utils';

import type { RecentReport } from '../../_lib/server/recent-reports.loader';
import type { UsageData } from '../../_lib/server/usage.loader';
import { UsageIndicator } from '../usage-indicator';
import { NavSidebar } from './nav-sidebar';

/**
 * App Header - Works with Claude-style sidebar
 *
 * Features:
 * - Positioned to the right of the sidebar
 * - Usage indicator on right
 * - Minimal, clean design
 */

interface NavHeaderProps {
  usage: UsageData | null;
  recentReports: RecentReport[];
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
}

export const NavHeader = memo(function NavHeader({
  usage,
  recentReports,
  user,
  workspace,
}: NavHeaderProps) {
  return (
    <>
      {/* Persistent Sidebar */}
      <NavSidebar
        recentReports={recentReports}
        user={user}
        workspace={workspace}
      />

      {/* Header - positioned after sidebar */}
      <header
        className={cn(
          'fixed top-0 right-0 z-30',
          'border-b border-zinc-200 dark:border-zinc-800',
          'bg-white/90 backdrop-blur-sm dark:bg-zinc-950/90',
          'transition-colors duration-200',
          // Left position accounts for sidebar - use CSS variable or fixed value
          'left-16', // collapsed sidebar width (64px = 16 * 4)
        )}
      >
        <nav className="flex h-14 items-center justify-end px-4 sm:px-6">
          {/* Right: Usage indicator */}
          <div className="flex items-center gap-4">
            {/* Usage indicator - only shows when >= 25% used */}
            {usage?.showUsageBar && (
              <Link href="/home/billing" className="w-28">
                <UsageIndicator
                  tokensUsed={usage.tokensUsed}
                  tokensLimit={usage.tokensLimit}
                  reportsCount={usage.reportsCount}
                  periodEnd={usage.periodEnd}
                />
              </Link>
            )}
          </div>
        </nav>
      </header>
    </>
  );
});
