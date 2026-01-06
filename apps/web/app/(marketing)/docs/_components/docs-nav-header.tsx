'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { RecentReport } from '~/app/_lib/server/recent-reports.loader';

import { DocsAppSidebar } from './docs-app-sidebar';

interface DocsNavHeaderProps {
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
  recentReports: RecentReport[];
}

/**
 * Navigation header for docs pages when user is logged in.
 * Displays the app sidebar toggle and Sparlo logo, similar to app pages.
 */
export function DocsNavHeader({
  user,
  workspace,
  recentReports,
}: DocsNavHeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Left: Sidebar toggle + Logo */}
      <div className="flex items-center gap-4">
        {/* App sidebar toggle */}
        <DocsAppSidebar
          user={user}
          workspace={workspace}
          recentReports={recentReports}
        />

        {/* Sparlo logo */}
        <Link href="/app" className="transition-opacity hover:opacity-70">
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

      {/* Right: empty for now, could add usage indicator if needed */}
      <div className="flex items-center gap-4" />
    </header>
  );
}
