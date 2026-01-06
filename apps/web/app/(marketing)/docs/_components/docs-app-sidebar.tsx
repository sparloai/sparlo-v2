'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { cn } from '@kit/ui/utils';

import type { RecentReport } from '~/app/_lib/server/recent-reports.loader';
import pathsConfig from '~/config/paths.config';

/**
 * DocsAppSidebar - Slide-out sidebar for logged-in users on docs pages
 *
 * Mirrors the main app NavSidebar UI but renders as an overlay
 * to avoid fixed positioning conflicts.
 */

interface DocsAppSidebarProps {
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
  recentReports: RecentReport[];
}

// Icons (same as NavSidebar)
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

function CloseIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
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
        d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
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
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    </svg>
  );
}

function BillingIcon({ className }: { className?: string }) {
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
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
      />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
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
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
      />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
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
        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
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
  const signOut = useSignOut();

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut.mutateAsync();
    handleClose();
  }, [signOut, handleClose]);

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
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  return (
    <>
      {/* Toggle Button - styled to match nav */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        aria-label="Open app menu"
        data-testid="docs-sidebar-toggle"
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
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-[101] flex h-full w-[260px] flex-col bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-zinc-900',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        data-testid="docs-sidebar-panel"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <Link
            href="/app"
            className="transition-opacity hover:opacity-70"
            onClick={handleClose}
          >
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
          <button
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Close menu"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {/* New Analysis */}
          <div className="mb-1 px-3">
            <Link
              href="/app/reports/new"
              onClick={handleClose}
              className="flex w-full items-center gap-3 rounded-lg bg-zinc-900 px-3 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              <PlusIcon className="h-5 w-5 flex-shrink-0" />
              <span>New Analysis</span>
            </Link>
          </div>

          {/* All Reports */}
          <div className="mb-4 px-3">
            <Link
              href="/app/reports"
              onClick={handleClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <ReportsIcon className="h-5 w-5 flex-shrink-0" />
              <span>All Reports</span>
            </Link>
          </div>

          {/* Recents */}
          {recentReports.length > 0 && (
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <div className="mb-2 px-4 text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
                Recents
              </div>
              <div className="space-y-0.5 px-3">
                {recentReports.slice(0, 10).map((report) => (
                  <Link
                    key={report.id}
                    href={`/app/reports/${report.id}`}
                    onClick={handleClose}
                    className="block truncate rounded px-3 py-1.5 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    {report.title || 'Untitled Report'}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer - Settings */}
        <div className="border-t border-zinc-200 py-3 dark:border-zinc-800">
          <div className="space-y-1 px-3">
            <Link
              href={pathsConfig.app.personalAccountSettings}
              onClick={handleClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <SettingsIcon className="h-4 w-4 flex-shrink-0" />
              <span>Settings</span>
            </Link>
            <Link
              href={pathsConfig.app.personalAccountBilling}
              onClick={handleClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <BillingIcon className="h-4 w-4 flex-shrink-0" />
              <span>Billing</span>
            </Link>
            <a
              href="mailto:help@sparlo.ai"
              onClick={handleClose}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <HelpIcon className="h-4 w-4 flex-shrink-0" />
              <span>Help</span>
            </a>
            <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <LogOutIcon className="h-4 w-4 flex-shrink-0" />
              <span>Log out</span>
            </button>
          </div>

          {/* User email */}
          <div className="mt-3 truncate border-t border-zinc-200 px-6 pt-3 text-[12px] text-zinc-400 dark:border-zinc-700">
            {workspace.name || user.email}
          </div>
        </div>
      </div>
    </>
  );
});

export default DocsAppSidebar;
