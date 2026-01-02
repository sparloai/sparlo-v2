'use client';

import { memo } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@kit/ui/utils';

import type { RecentReport } from '../../_lib/server/recent-reports.loader';
import type { UsageData } from '../../_lib/server/usage.loader';
import { useSidebarState } from '../../_lib/sidebar-context';
import { UsageIndicator } from '../usage-indicator';
import { NavSidebar } from './nav-sidebar';

/**
 * App Header - Works with Claude-style sidebar
 *
 * Features:
 * - Positioned to the right of the sidebar (desktop)
 * - Full-width with hamburger menu (mobile)
 * - Usage indicator on right
 * - Minimal, clean design
 */

interface NavHeaderProps {
  usage: UsageData | null;
  recentReports: RecentReport[];
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
      />
    </svg>
  );
}

export const NavHeader = memo(function NavHeader({
  usage,
  recentReports,
  user,
  workspace,
}: NavHeaderProps) {
  const { sidebarWidth, isMobile, setMobileMenuOpen } = useSidebarState();

  return (
    <>
      {/* Persistent Sidebar */}
      <NavSidebar
        recentReports={recentReports}
        user={user}
        workspace={workspace}
      />

      {/* Header - positioned after sidebar (desktop) or full-width (mobile) */}
      <header
        className={cn(
          'fixed top-0 right-0 z-30',
          'border-b border-zinc-200 dark:border-zinc-800',
          'bg-white/90 backdrop-blur-sm dark:bg-zinc-950/90',
          'transition-[left] duration-300 ease-out',
        )}
        style={{ left: sidebarWidth }}
      >
        <nav className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left: Hamburger menu (mobile) or Logo (desktop) */}
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                aria-label="Open menu"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            )}
            <Link href="/home" className="transition-opacity hover:opacity-70">
              <Image
                src="/images/sparlo-logo.png"
                alt="Sparlo"
                width={80}
                height={22}
                className="h-[22px] w-auto dark:hidden"
              />
              <Image
                src="/images/sparlo-logo-white.png"
                alt="Sparlo"
                width={80}
                height={22}
                className="hidden h-[22px] w-auto dark:block"
              />
            </Link>
          </div>

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
