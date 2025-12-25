'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { formatDistanceToNow } from 'date-fns';
import {
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
];

function RecentReportItem({
  report,
  onClose,
  isActive,
}: {
  report: RecentReport;
  onClose: () => void;
  isActive: boolean;
}) {
  const modeLabel = report.mode === 'discovery' ? 'Discovery' : 'Analysis';

  return (
    <Link
      href={`/home/reports/${report.id}`}
      onClick={onClose}
      className={cn(
        'flex items-start gap-3 rounded-md border-l-2 px-2 py-2.5 transition-all duration-200',
        isActive
          ? 'border-l-violet-500 bg-violet-500/10 dark:bg-violet-500/15'
          : 'border-l-transparent hover:border-l-violet-500/50 hover:bg-black/10 dark:hover:bg-white/10',
      )}
    >
      <div
        className={cn(
          'mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors',
          isActive
            ? 'bg-violet-500'
            : 'bg-black/40 dark:bg-white/40',
        )}
      />
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] tracking-wider text-black/50 uppercase dark:text-white/50">
          [{modeLabel}]
        </span>
        <p className={cn(
          'truncate text-sm transition-colors',
          isActive
            ? 'text-black dark:text-white'
            : 'text-black/80 dark:text-white/80',
        )}>
          {report.title || 'Untitled Report'}
        </p>
        <p className="font-mono text-xs text-black/40 dark:text-white/40">
          {formatDistanceToNow(new Date(report.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
      <FileText className={cn(
        'mt-1 h-3.5 w-3.5 flex-shrink-0 transition-colors',
        isActive
          ? 'text-violet-500'
          : 'text-black/30 dark:text-white/30',
      )} />
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
  const pathname = usePathname();
  const signOutMutation = useSignOut();
  const { resolvedTheme } = useTheme();

  const close = () => onOpenChange(false);

  const isActivePath = (href: string) => {
    if (href === '/home') {
      return pathname === '/home';
    }
    return pathname.startsWith(href);
  };

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
        className="flex w-72 flex-col border-r border-black/10 bg-white p-0 dark:border-white/10 dark:bg-black"
      >
        {/* Header with logo */}
        <div className="flex h-14 items-center border-b border-black/10 px-4 dark:border-white/10">
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
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = isActivePath(href);
            const isNewAnalysis = href === '/home/reports/new';

            return (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  'flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 transition-all duration-200',
                  isNewAnalysis
                    ? isActive
                      ? 'border-l-violet-500 bg-violet-500/15 dark:bg-violet-500/20'
                      : 'border-l-violet-500/50 bg-violet-500/5 hover:border-l-violet-500 hover:bg-violet-500/15 dark:bg-violet-500/10 dark:hover:bg-violet-500/20'
                    : isActive
                      ? 'border-l-violet-500 bg-violet-500/10 dark:bg-violet-500/15'
                      : 'border-l-transparent hover:border-l-violet-500/50 hover:bg-black/10 dark:hover:bg-white/10',
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    isNewAnalysis
                      ? 'text-violet-600 dark:text-violet-400'
                      : isActive
                        ? 'text-violet-500'
                        : 'text-black/50 dark:text-white/50',
                  )}
                />
                <span
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isNewAnalysis
                      ? 'text-violet-700 dark:text-violet-300'
                      : isActive
                        ? 'text-black dark:text-white'
                        : 'text-black/80 dark:text-white/80',
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Recent Reports */}
        <div className="flex-1 overflow-y-auto border-t border-black/10 dark:border-white/10">
          <div className="px-4 py-3">
            <h3 className="text-xs font-medium tracking-wider text-black/40 uppercase dark:text-white/40">
              Recent
            </h3>
          </div>

          {recentReports.length === 0 ? (
            <p className="px-4 text-sm text-black/40 dark:text-white/40">
              No reports yet
            </p>
          ) : (
            <div className="space-y-0.5 px-2">
              {recentReports.map((report) => (
                <RecentReportItem
                  key={report.id}
                  report={report}
                  onClose={close}
                  isActive={pathname === `/home/reports/${report.id}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer: Usage + User */}
        <div className="border-t border-black/10 dark:border-white/10">
          {/* Usage indicator - only shows when >= 25% used */}
          {usage?.showUsageBar && (
            <Link
              href="/home/settings/billing"
              onClick={close}
              className="block border-b border-black/10 px-4 py-3 transition-all duration-200 hover:bg-black/10 dark:border-white/10 dark:hover:bg-white/10"
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
                className="flex w-full items-center gap-3 px-4 py-3 transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10"
                aria-label="Account menu"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5">
                  <span className="text-xs font-medium text-black/60 dark:text-white/60">
                    {initials}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="truncate text-sm font-medium text-black/80 dark:text-white/80">
                    {workspace?.name || user?.email || 'Account'}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="start"
              side="top"
              className="w-48 border-black/10 bg-white dark:border-white/10 dark:bg-black"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/home/settings"
                  onClick={close}
                  className="cursor-pointer text-black/80 focus:bg-black/5 focus:text-black dark:text-white/80 dark:focus:bg-white/5 dark:focus:text-white"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <Trans i18nKey="common:routes.settings" />
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/home/settings/billing"
                  onClick={close}
                  className="cursor-pointer text-black/80 focus:bg-black/5 focus:text-black dark:text-white/80 dark:focus:bg-white/5 dark:focus:text-white"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <Trans i18nKey="common:routes.billing" />
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />

              {/* Theme Toggle */}
              <SubMenuModeToggle />

              <DropdownMenuSeparator className="bg-black/10 dark:bg-white/10" />

              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={signOutMutation.isPending}
                className="cursor-pointer text-red-600 focus:bg-black/5 focus:text-red-600 dark:text-red-400 dark:focus:bg-white/5 dark:focus:text-red-400"
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
