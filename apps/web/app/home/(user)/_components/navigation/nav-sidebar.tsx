'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { cn } from '@kit/ui/utils';

import pathsConfig from '~/config/paths.config';

import type { RecentReport } from '../../_lib/server/recent-reports.loader';

/**
 * App Sidebar - Air Company Aesthetic
 *
 * Features:
 * - Dark background (zinc-950)
 * - No icons, text only
 * - Resizable with drag handle (like Claude)
 * - Actions at top, reports below
 * - Minimal user section at bottom
 * - Premium staggered animations on open/close
 */

// Premium easing - slightly slower start, smooth finish
const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

// Animation durations
const SIDEBAR_DURATION = 400; // ms
const CONTENT_STAGGER = 50; // ms between each content section

interface NavSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentReports: RecentReport[];
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 288; // 18rem = 288px

/**
 * Format time in minimal style:
 * - Under 1 hour: "15m"
 * - Under 24 hours: "15h"
 * - Under 7 days: "3d"
 * - Otherwise: "Dec 15"
 */
function formatMinimalTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${Math.max(1, diffMins)}m`;
  }
  if (diffHours < 24) {
    return `${diffHours}h`;
  }
  if (diffDays < 7) {
    return `${diffDays}d`;
  }

  // Format as "Dec 15"
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const NavSidebar = memo(function NavSidebar({
  open,
  onOpenChange,
  recentReports,
  user,
  workspace,
}: NavSidebarProps) {
  const router = useRouter();
  const signOut = useSignOut();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);

  // Track if sidebar has ever been opened (for initial render optimization)
  useEffect(() => {
    if (open && !hasEverOpened) {
      setHasEverOpened(true);
    }
  }, [open, hasEverOpened]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Close on click outside is now handled by backdrop onClick

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleNewAnalysis = useCallback(() => {
    router.push(pathsConfig.app.home);
    onOpenChange(false);
  }, [router, onOpenChange]);

  const handleSignOut = useCallback(async () => {
    await signOut.mutateAsync();
    onOpenChange(false);
  }, [signOut, onOpenChange]);

  const closeSidebar = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Don't render anything until sidebar has been opened at least once
  if (!hasEverOpened) return null;

  // Inline styles for premium animations (CSS-in-JS for dynamic timing)
  const sidebarStyle = {
    width,
    transition: `transform ${SIDEBAR_DURATION}ms ${EASE_OUT_EXPO}`,
  };

  const backdropStyle = {
    transition: `opacity ${SIDEBAR_DURATION}ms ${EASE_OUT_EXPO}, backdrop-filter ${SIDEBAR_DURATION}ms ${EASE_OUT_EXPO}`,
  };

  // Staggered content animation helper
  const contentStyle = (index: number) => ({
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : 'translateY(8px)',
    transition: open
      ? `opacity ${300}ms ${EASE_OUT_EXPO} ${100 + index * CONTENT_STAGGER}ms, transform ${300}ms ${EASE_OUT_EXPO} ${100 + index * CONTENT_STAGGER}ms`
      : `opacity ${200}ms ${EASE_OUT_EXPO}, transform ${200}ms ${EASE_OUT_EXPO}`,
  });

  return (
    <>
      {/* Backdrop - Premium blur + fade */}
      <div
        className={cn(
          'fixed inset-0 z-40',
          open
            ? 'pointer-events-auto bg-black/60 backdrop-blur-sm'
            : 'pointer-events-none bg-black/0 backdrop-blur-none',
        )}
        style={backdropStyle}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar - Smooth slide with premium easing */}
      <div
        ref={sidebarRef}
        style={sidebarStyle}
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full flex-col bg-zinc-950',
          open ? 'translate-x-0' : '-translate-x-full',
          isResizing && 'select-none',
          !open && 'pointer-events-none',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation sidebar"
      >
        {/* Header - Stagger index 0 */}
        <div className="flex items-center justify-between px-6 py-5" style={contentStyle(0)}>
          <Link href="/home" onClick={closeSidebar}>
            <Image
              src="/images/sparlo-logo-white.png"
              alt="Sparlo"
              width={80}
              height={22}
              className="h-[22px] w-auto"
            />
          </Link>
          <button
            onClick={closeSidebar}
            className="group p-2 text-zinc-500 transition-colors hover:text-white"
            aria-label="Close sidebar"
          >
            <svg
              className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Actions - At Top - Stagger index 1 */}
        <div className="space-y-2 px-6 pb-6" style={contentStyle(1)}>
          <button
            onClick={handleNewAnalysis}
            className="block text-[17px] leading-[1.2] tracking-[-0.02em] text-white transition-colors hover:text-zinc-300"
          >
            + New Analysis
          </button>
          <Link
            href="/home/reports"
            onClick={closeSidebar}
            className="block text-[17px] leading-[1.2] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-white"
          >
            All Reports
          </Link>
        </div>

        {/* Reports List - Stagger index 2 */}
        <div
          className="flex-1 overflow-y-auto border-t border-zinc-800 px-6 py-4"
          style={contentStyle(2)}
        >
          <div className="mb-4 text-[12px] font-medium tracking-[0.05em] text-zinc-600 uppercase">
            Recent
          </div>

          {recentReports.length > 0 ? (
            <nav className="space-y-1">
              {recentReports.map((report, index) => (
                <Link
                  key={report.id}
                  href={`/home/reports/${report.id}`}
                  onClick={closeSidebar}
                  className="group flex items-start gap-3 rounded py-2 transition-colors hover:bg-zinc-900"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? 'translateX(0)' : 'translateX(-8px)',
                    transition: open
                      ? `opacity 250ms ${EASE_OUT_EXPO} ${200 + index * 30}ms, transform 250ms ${EASE_OUT_EXPO} ${200 + index * 30}ms`
                      : `opacity 150ms ${EASE_OUT_EXPO}, transform 150ms ${EASE_OUT_EXPO}`,
                  }}
                >
                  {/* Number */}
                  <span className="w-5 flex-shrink-0 text-right text-[14px] leading-[1.2] tracking-[-0.02em] text-zinc-600">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>

                  {/* Title + Time */}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] leading-[1.2] tracking-[-0.02em] text-zinc-400 transition-colors group-hover:text-white">
                      {report.title || 'Untitled Report'}
                    </div>
                    <div className="mt-1 text-[12px] leading-[1.2] tracking-[-0.02em] text-zinc-600">
                      {formatMinimalTime(report.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </nav>
          ) : (
            <p className="text-[14px] leading-[1.2] tracking-[-0.02em] text-zinc-600">
              No reports yet
            </p>
          )}
        </div>

        {/* User Section - Stagger index 3 */}
        <div className="border-t border-zinc-800 px-6 py-4" style={contentStyle(3)}>
          <div className="mb-3 text-[14px] leading-[1.2] tracking-[-0.02em] text-zinc-400">
            {workspace.name || user.email || 'Account'}
          </div>
          <div className="space-y-2">
            <Link
              href={pathsConfig.app.personalAccountSettings}
              onClick={closeSidebar}
              className="block text-[13px] leading-[1.2] tracking-[-0.02em] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              Settings
            </Link>
            <Link
              href={pathsConfig.app.personalAccountBilling}
              onClick={closeSidebar}
              className="block text-[13px] leading-[1.2] tracking-[-0.02em] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              Billing
            </Link>
            <button
              onClick={handleSignOut}
              className="block text-[13px] leading-[1.2] tracking-[-0.02em] text-zinc-600 transition-colors hover:text-zinc-400"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute top-0 right-0 h-full w-1 cursor-ew-resize transition-colors',
            isResizing ? 'bg-zinc-600' : 'bg-transparent hover:bg-zinc-700',
          )}
          aria-label="Resize sidebar"
        />
      </div>
    </>
  );
});

export default NavSidebar;
