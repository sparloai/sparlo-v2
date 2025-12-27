'use client';

import { memo, useState } from 'react';

import Link from 'next/link';

import { cn } from '@kit/ui/utils';

import type { RecentReport } from '../../_lib/server/recent-reports.loader';
import type { UsageData } from '../../_lib/server/usage.loader';
import { UsageIndicator } from '../usage-indicator';
import { NavSidebar } from './nav-sidebar';

/**
 * App Header - Air Company Aesthetic
 *
 * Features:
 * - Minimal, text-based wordmark
 * - Clean hamburger icon (no lucide)
 * - Usage indicator on right
 * - Transparent with subtle border
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-50',
          'border-b border-zinc-200 dark:border-zinc-800',
          'bg-white/90 backdrop-blur-sm dark:bg-zinc-950/90',
          'transition-colors duration-200',
        )}
      >
        <nav className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-4">
            {/* Hamburger trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Open navigation menu"
            >
              <svg
                className="h-5 w-5 text-zinc-600 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <Link
              href="/home"
              className="text-[18px] leading-[1.2] font-semibold tracking-[-0.02em] text-zinc-900 transition-opacity hover:opacity-70 dark:text-white"
            >
              Sparlo
            </Link>
          </div>

          {/* Right: Usage indicator */}
          <div className="flex items-center gap-4">
            {/* Usage indicator - only shows when >= 25% used */}
            {usage?.showUsageBar && (
              <Link href="/home/billing" className="hidden w-28 md:block">
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

      {/* Sidebar */}
      <NavSidebar
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        recentReports={recentReports}
        user={user}
        workspace={workspace}
      />
    </>
  );
});
