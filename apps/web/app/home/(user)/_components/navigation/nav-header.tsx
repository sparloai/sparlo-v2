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
 * - Premium animated menu icon
 * - Usage indicator on right
 * - Transparent with subtle border
 */

interface NavHeaderProps {
  usage: UsageData | null;
  recentReports: RecentReport[];
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
}

/**
 * Premium Menu Icon - Air Company Aesthetic
 *
 * Three horizontal lines with staggered animation on hover:
 * - Lines spread apart vertically
 * - Subtle width changes for visual interest
 * - Smooth easing for premium feel
 */
function MenuIcon({ isHovered }: { isHovered: boolean }) {
  return (
    <div className="relative flex h-4 w-5 flex-col items-end justify-center gap-[5px]">
      {/* Top line */}
      <span
        className={cn(
          'h-[1.5px] bg-zinc-900 transition-all duration-300 ease-out dark:bg-zinc-100',
          isHovered ? 'w-5 -translate-y-[1px]' : 'w-5',
        )}
      />
      {/* Middle line */}
      <span
        className={cn(
          'h-[1.5px] bg-zinc-900 transition-all duration-300 ease-out delay-[50ms] dark:bg-zinc-100',
          isHovered ? 'w-3.5' : 'w-5',
        )}
      />
      {/* Bottom line */}
      <span
        className={cn(
          'h-[1.5px] bg-zinc-900 transition-all duration-300 ease-out delay-[100ms] dark:bg-zinc-100',
          isHovered ? 'w-5 translate-y-[1px]' : 'w-5',
        )}
      />
    </div>
  );
}

export const NavHeader = memo(function NavHeader({
  usage,
  recentReports,
  user,
  workspace,
}: NavHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);

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
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-5">
            {/* Menu trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              onMouseEnter={() => setMenuHovered(true)}
              onMouseLeave={() => setMenuHovered(false)}
              className={cn(
                'group flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300',
                'hover:bg-zinc-100 dark:hover:bg-zinc-800/80',
                'active:scale-95',
              )}
              aria-label="Open navigation menu"
            >
              <MenuIcon isHovered={menuHovered} />
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
