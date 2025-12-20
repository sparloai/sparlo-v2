'use client';

import { useState, useTransition } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { formatDistanceToNow } from 'date-fns';
import {
  Archive,
  CreditCard,
  FileText,
  FolderOpen,
  LogOut,
  PlusCircle,
  Settings,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { SubMenuModeToggle } from '@kit/ui/mode-toggle';
import { Sheet, SheetContent } from '@kit/ui/sheet';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import type { RecentReport } from '../../_lib/server/recent-reports.loader';
import { archiveReport } from '../../_lib/server/sparlo-reports-server-actions';
import type { UsageData } from '../../_lib/server/usage.loader';
import { UsageIndicator } from '../usage-indicator';

interface NavSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usage: UsageData | null;
  recentReports: RecentReport[];
  user: { id: string; email?: string | null };
  workspace: { name?: string | null };
}

const NAV_ITEMS = [
  { href: '/home/reports/new', label: 'New Analysis', icon: PlusCircle },
  { href: '/home', label: 'All Reports', icon: FolderOpen },
  { href: '/home/archived', label: 'Archived', icon: Archive },
];

function RecentReportItem({
  report,
  onClose,
}: {
  report: RecentReport;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleArchive = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await archiveReport({ id: report.id, archived: true });
      router.refresh();
    });
  };

  const modeLabel = report.mode === 'discovery' ? 'Discovery' : 'Analysis';

  return (
    <Link
      href={`/home/reports/${report.id}`}
      onClick={onClose}
      className="group relative flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-[--surface-overlay]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
      <div className="min-w-0 flex-1">
        <span
          className="font-mono text-[10px] tracking-wider text-[--text-muted] uppercase"
          style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
        >
          [{modeLabel}]
        </span>
        <p
          className="truncate text-sm font-medium text-[--text-secondary]"
          style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
        >
          {report.title || 'Untitled Report'}
        </p>
        <p
          className="text-xs text-[--text-muted]"
          style={{ fontFamily: 'Soehne Mono, JetBrains Mono, monospace' }}
        >
          {formatDistanceToNow(new Date(report.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
      {isHovered ? (
        <button
          onClick={handleArchive}
          disabled={isPending}
          className="flex-shrink-0 rounded p-1 text-[--text-muted] transition-colors hover:bg-[--surface-elevated] hover:text-[--text-secondary]"
          title="Archive report"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      ) : (
        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-[--text-muted]" />
      )}
    </Link>
  );
}

export function NavSidebar({
  open,
  onOpenChange,
  usage,
  recentReports,
  user,
  workspace,
}: NavSidebarProps) {
  const router = useRouter();
  const signOutMutation = useSignOut();
  const { resolvedTheme } = useTheme();

  const close = () => onOpenChange(false);

  const handleSignOut = async () => {
    await signOutMutation.mutateAsync();
    router.push('/');
  };

  const initials =
    workspace?.name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  const logoSrc =
    resolvedTheme === 'dark'
      ? '/images/sparlo-grid-logo-white.png'
      : '/images/sparlo-grid-logo-black.png';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className={cn(
          'flex w-72 flex-col p-0',
          'bg-[--nav-bg] backdrop-blur-[var(--nav-blur)]',
          'border-[--nav-border]',
          'supports-[not(backdrop-filter)]:bg-[--nav-bg-solid]',
        )}
      >
        {/* Header with logo */}
        <div className="flex h-14 items-center border-b border-[--nav-border] px-4">
          <Link
            href="/home"
            onClick={close}
            className="transition-opacity hover:opacity-70"
          >
            <Image
              src={logoSrc}
              alt="Sparlo"
              width={80}
              height={20}
              className="h-5 w-auto"
            />
          </Link>
        </div>

        {/* Primary Navigation */}
        <nav className="space-y-1 p-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-[--surface-overlay]"
            >
              <Icon className="h-4 w-4 text-[--text-muted]" />
              <span
                className="text-sm font-medium text-[--text-secondary]"
                style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
              >
                {label}
              </span>
            </Link>
          ))}
        </nav>

        {/* Recent Reports */}
        <div className="flex-1 overflow-y-auto border-t border-[--nav-border]">
          <div className="px-4 py-3">
            <h3
              className="text-xs font-medium tracking-wider text-[--text-muted] uppercase"
              style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
            >
              Recent
            </h3>
          </div>

          {recentReports.length === 0 ? (
            <p
              className="px-4 text-sm text-[--text-muted]"
              style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
            >
              No reports yet
            </p>
          ) : (
            <div className="space-y-1 px-2">
              {recentReports.map((report) => (
                <RecentReportItem
                  key={report.id}
                  report={report}
                  onClose={close}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer: Usage + User */}
        <div className="border-t border-[--nav-border]">
          {/* Usage indicator - only shows when >= 25% used */}
          {usage?.showUsageBar && (
            <Link
              href="/home/settings/billing"
              onClick={close}
              className="block border-b border-[--nav-border] px-4 py-3 transition-colors hover:bg-[--surface-overlay]"
            >
              <UsageIndicator
                tokensUsed={usage.tokensUsed}
                tokensLimit={usage.tokensLimit}
                reportsCount={usage.reportsCount}
                periodEnd={usage.periodEnd}
              />
            </Link>
          )}

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-[--surface-overlay]"
                aria-label="Account menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[--border-default] bg-[--surface-overlay]">
                  <span
                    className="text-[12px] font-medium text-[--text-muted]"
                    style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                  >
                    {initials}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="truncate text-sm font-medium text-[--text-primary]"
                    style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                  >
                    {workspace?.name || user?.email || 'Account'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              side="top"
              className="w-48 border-[--border-default] bg-[--surface-elevated]"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/home/settings"
                  onClick={close}
                  className="cursor-pointer text-[--text-primary] focus:bg-[--surface-overlay] focus:text-[--text-primary]"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <Trans i18nKey="common:routes.settings" />
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/home/settings/billing"
                  onClick={close}
                  className="cursor-pointer text-[--text-primary] focus:bg-[--surface-overlay] focus:text-[--text-primary]"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <Trans i18nKey="common:routes.billing" />
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-[--border-default]" />

              {/* Theme Toggle */}
              <SubMenuModeToggle />

              <DropdownMenuSeparator className="bg-[--border-default]" />

              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={signOutMutation.isPending}
                className="cursor-pointer text-[--status-error] focus:bg-[--surface-overlay] focus:text-[--status-error]"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <Trans i18nKey="common:nav.signOut" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetContent>
    </Sheet>
  );
}
