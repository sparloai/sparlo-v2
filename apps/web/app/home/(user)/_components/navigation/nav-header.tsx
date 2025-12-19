'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Menu } from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@kit/ui/utils';

import type { RecentReport } from '../../_lib/server/recent-reports.loader';
import type { UsageData } from '../../_lib/server/usage.loader';
import { UsageIndicator } from '../usage-indicator';
import { NavSidebar } from './nav-sidebar';

interface NavHeaderProps {
  usage: UsageData | null;
  recentReports: RecentReport[];
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
}

export function NavHeader({
  usage,
  recentReports,
  user,
  workspace,
}: NavHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme } = useTheme();

  const logoSrc =
    resolvedTheme === 'dark'
      ? '/images/sparlo-grid-logo-white.png'
      : '/images/sparlo-grid-logo-black.png';

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-50',
          'border-b border-[--nav-border]',
          'bg-[--nav-bg] backdrop-blur-[var(--nav-blur)]',
          'shadow-[--nav-shadow]',
          'transition-colors duration-200',
          'supports-[not(backdrop-filter)]:bg-[--nav-bg-solid]',
        )}
      >
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            {/* Hamburger trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-[--surface-overlay]"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5 text-[--text-secondary]" />
            </button>

            <Link href="/home" className="transition-opacity hover:opacity-70">
              <Image
                src={logoSrc}
                alt="Sparlo"
                width={80}
                height={20}
                className="h-5 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Right: Usage indicator */}
          <div className="flex items-center gap-4">
            {/* Usage indicator - only shows when >= 25% used */}
            {usage?.showUsageBar && (
              <Link
                href="/home/settings/billing"
                className="hidden w-28 md:block"
              >
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
        usage={usage}
        recentReports={recentReports}
        user={user}
        workspace={workspace}
      />
    </>
  );
}
