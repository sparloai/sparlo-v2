'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Users } from 'lucide-react';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { cn } from '@kit/ui/utils';

import pathsConfig from '~/config/paths.config';
import { useAppPath } from '~/lib/hooks/use-app-path';

import { useAppWorkspace } from '../../_lib/app-workspace-context';
import type { RecentReport } from '../../_lib/server/recent-reports.loader';
import {
  COLLAPSED_WIDTH,
  EXPANDED_WIDTH,
  useSidebarState,
} from '../../_lib/sidebar-context';

/**
 * App Sidebar - Claude-style
 *
 * Features:
 * - Persistent sidebar (not overlay)
 * - Expanded: icons + text + recent reports
 * - Collapsed: icons only with tooltips
 * - Settings dropdown at bottom
 * - Smooth expand/collapse animation
 */

interface NavSidebarProps {
  recentReports: RecentReport[];
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
}

/**
 * Tooltip component for collapsed state
 */
function Tooltip({
  children,
  label,
  show,
}: {
  children: React.ReactNode;
  label: string;
  show: boolean;
}) {
  return (
    <div className="relative">
      {children}
      {show && (
        <div className="pointer-events-none absolute top-1/2 left-full z-50 ml-3 -translate-y-1/2 rounded bg-zinc-900 px-2.5 py-1.5 text-sm whitespace-nowrap text-white shadow-lg">
          {label}
          {/* Arrow */}
          <div className="absolute top-1/2 right-full -translate-y-1/2 border-4 border-transparent border-r-zinc-900" />
        </div>
      )}
    </div>
  );
}

/**
 * Settings dropdown menu - Sparlo design system
 */
function SettingsDropdown({
  isOpen,
  onClose,
  onSignOut,
  collapsed,
  userEmail,
  getPath,
  isPaidPlan,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  collapsed: boolean;
  userEmail?: string | null;
  getPath: (path: string) => string;
  isPaidPlan: boolean;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className={cn(
        'absolute bottom-full mb-3 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900',
        collapsed ? 'left-full ml-3 w-56' : 'right-0 left-0 mx-2',
      )}
    >
      {/* User Info Header with signature left border */}
      {userEmail && (
        <>
          <div className="border-l-2 border-zinc-900 px-3 py-3 dark:border-zinc-100">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase dark:text-zinc-500">
              Signed in as
            </span>
            <span className="block truncate text-[15px] font-medium tracking-[-0.01em] text-zinc-900 dark:text-white">
              {userEmail}
            </span>
          </div>
          <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />
        </>
      )}

      <Link
        href={getPath(pathsConfig.app.personalAccountSettings)}
        onClick={onClose}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <SettingsIcon className="h-[18px] w-[18px] flex-shrink-0" />
        Settings
      </Link>
      <Link
        href={getPath(pathsConfig.app.personalAccountBilling)}
        onClick={onClose}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <BillingIcon className="h-[18px] w-[18px] flex-shrink-0" />
        Billing
      </Link>
      {isPaidPlan && (
        <Link
          href={getPath(pathsConfig.app.personalAccountTeams)}
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <Users
            className="h-[18px] w-[18px] flex-shrink-0"
            strokeWidth={1.5}
          />
          Teams
        </Link>
      )}
      <Link
        href={getPath('/app/help')}
        onClick={onClose}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <HelpIcon className="h-[18px] w-[18px] flex-shrink-0" />
        Help Center
      </Link>

      <div className="my-1.5 h-px bg-zinc-100 dark:bg-zinc-800" />

      <button
        onClick={() => {
          onSignOut();
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
      >
        <LogOutIcon className="h-[18px] w-[18px] flex-shrink-0" />
        Sign out
      </button>
    </div>
  );
}

// Icons - Consistent 1.5px stroke following Sparlo design system
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChevronUpDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  );
}

function ReportsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function BillingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function CollapseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m14 9-3 3 3 3" />
    </svg>
  );
}

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      <path d="m16 15-3-3 3-3" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export const NavSidebar = memo(function NavSidebar({
  recentReports,
  user,
  workspace,
}: NavSidebarProps) {
  const router = useRouter();
  const signOut = useSignOut();
  const { getPath } = useAppPath();
  const { isPaidPlan } = useAppWorkspace();
  const {
    collapsed,
    setCollapsed,
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useSidebarState();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Toggle collapsed state (persisted via context)
  const toggleCollapsed = useCallback(() => {
    setCollapsed(!collapsed);
    setSettingsOpen(false);
  }, [collapsed, setCollapsed]);

  const handleNewAnalysis = useCallback(() => {
    if (isMobile) setMobileMenuOpen(false);
    router.push(getPath('/app/reports/new'));
  }, [router, isMobile, setMobileMenuOpen, getPath]);

  const handleSignOut = useCallback(async () => {
    await signOut.mutateAsync();
  }, [signOut]);

  const handleLinkClick = useCallback(() => {
    if (isMobile) setMobileMenuOpen(false);
  }, [isMobile, setMobileMenuOpen]);

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  // On mobile, hide sidebar completely when menu is closed
  if (isMobile && !mobileMenuOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        style={{ width: isMobile ? EXPANDED_WIDTH : width }}
        className={cn(
          'fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-zinc-200 bg-white transition-[width,transform] duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950',
          isMobile && 'shadow-2xl',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-zinc-200 dark:border-zinc-800',
            collapsed && !isMobile
              ? 'justify-center px-0'
              : 'justify-between px-4',
          )}
        >
          {(!collapsed || isMobile) && (
            <Link
              href={getPath('/app')}
              onClick={handleLinkClick}
              className="transition-opacity hover:opacity-70"
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
          )}
          {isMobile ? (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={toggleCollapsed}
              className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                <ExpandIcon className="h-5 w-5" />
              ) : (
                <CollapseIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {/* New Analysis */}
          <div
            className="mb-1 px-2"
            onMouseEnter={() => setHoveredItem('new')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Tooltip
              label="New Analysis"
              show={collapsed && !isMobile && hoveredItem === 'new'}
            >
              <button
                onClick={handleNewAnalysis}
                className={cn(
                  'flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-lg py-2.5 text-base font-medium transition-colors',
                  'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100',
                  collapsed && !isMobile ? 'justify-center px-3' : 'px-4',
                )}
              >
                <PlusIcon className="h-5 w-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span>New Analysis</span>}
              </button>
            </Tooltip>
          </div>

          {/* All Reports */}
          <div
            className="mb-4 px-2"
            onMouseEnter={() => setHoveredItem('reports')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Tooltip
              label="All Reports"
              show={collapsed && !isMobile && hoveredItem === 'reports'}
            >
              <Link
                href={getPath('/app/reports')}
                onClick={handleLinkClick}
                className={cn(
                  'flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-lg py-2.5 text-base text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
                  collapsed && !isMobile ? 'justify-center px-3' : 'px-4',
                )}
              >
                <ReportsIcon className="h-5 w-5 flex-shrink-0" />
                {(!collapsed || isMobile) && <span>All Reports</span>}
              </Link>
            </Tooltip>
          </div>

          {/* Recents - show when expanded or on mobile */}
          {(!collapsed || isMobile) && recentReports.length > 0 && (
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <div className="mb-2 px-4 text-xs font-medium tracking-wider text-zinc-400 uppercase">
                Recents
              </div>
              <div className="space-y-0.5 px-3">
                {recentReports.slice(0, 10).map((report) => (
                  <Link
                    key={report.id}
                    href={getPath(`/home/reports/${report.id}`)}
                    onClick={handleLinkClick}
                    className="block min-h-[36px] truncate rounded px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    {report.title || 'Untitled Report'}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom: Settings */}
        <div className="relative border-t border-zinc-200 py-3 dark:border-zinc-800">
          <SettingsDropdown
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            onSignOut={handleSignOut}
            collapsed={collapsed && !isMobile}
            userEmail={user.email}
            getPath={getPath}
            isPaidPlan={isPaidPlan}
          />

          <div
            className="px-2"
            onMouseEnter={() => setHoveredItem('settings')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <Tooltip
              label={user.email || 'Settings'}
              show={
                collapsed &&
                !isMobile &&
                hoveredItem === 'settings' &&
                !settingsOpen
              }
            >
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={cn(
                  'group/settings flex w-full cursor-pointer items-center gap-3 rounded-lg py-2.5 transition-colors',
                  collapsed && !isMobile ? 'justify-center px-3' : 'px-3',
                  settingsOpen
                    ? 'bg-zinc-100 dark:bg-zinc-800'
                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
                )}
              >
                {/* User Avatar */}
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-[13px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {(user.email?.[0] || 'U').toUpperCase()}
                </div>

                {(!collapsed || isMobile) && (
                  <>
                    <div className="flex flex-1 flex-col truncate text-left">
                      <span className="truncate text-[15px] font-medium tracking-[-0.01em] text-zinc-900 dark:text-white">
                        {workspace.name || 'My Account'}
                      </span>
                      <span className="truncate text-[13px] tracking-[-0.02em] text-zinc-500 dark:text-zinc-400">
                        {user.email}
                      </span>
                    </div>
                    <ChevronUpDownIcon
                      className={cn(
                        'h-4 w-4 flex-shrink-0 text-zinc-400 transition-colors dark:text-zinc-500',
                        settingsOpen && 'text-zinc-600 dark:text-zinc-300',
                      )}
                    />
                  </>
                )}
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>
    </>
  );
});

export default NavSidebar;
