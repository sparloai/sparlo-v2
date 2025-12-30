'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@kit/ui/utils';

import { NavSidebar } from '~/home/(user)/_components/navigation/nav-sidebar';
import type { RecentReport } from '~/home/(user)/_lib/server/recent-reports.loader';
import { SidebarProvider } from '~/home/(user)/_lib/sidebar-context';

/**
 * DocsAppSidebar - Overlay wrapper for the main app NavSidebar
 *
 * Uses the same NavSidebar component from the main app,
 * but renders it as an overlay for the docs pages.
 */

interface DocsAppSidebarProps {
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
  recentReports: RecentReport[];
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
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

export const DocsAppSidebar = memo(function DocsAppSidebar({
  user,
  workspace,
  recentReports,
}: DocsAppSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle escape key and click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label="Open app menu"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300',
          isOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
      />

      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-[101] h-full transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Override sidebar positioning to work in overlay mode */}
        <SidebarProvider>
          <div className="relative h-full">
            <NavSidebar
              recentReports={recentReports}
              user={user}
              workspace={workspace}
            />
          </div>
        </SidebarProvider>
      </div>
    </>
  );
});

export default DocsAppSidebar;
