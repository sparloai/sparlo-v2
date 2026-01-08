'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { JWTUserData } from '@kit/supabase/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { If } from '@kit/ui/if';
import { ProfileAvatar } from '@kit/ui/profile-avatar';
import { cn } from '@kit/ui/utils';

import { usePersonalAccountData } from '../hooks/use-personal-account-data';

/**
 * Minimal icon components following Sparlo design system
 * Consistent 1.5px stroke, 24x24 viewBox
 */
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

function SignOutIcon({ className }: { className?: string }) {
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

function ChevronIcon({ className }: { className?: string }) {
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

function DashboardIcon({ className }: { className?: string }) {
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
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function TeamsIcon({ className }: { className?: string }) {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function PersonalAccountDropdown({
  className,
  user,
  signOutRequested,
  showProfileName = true,
  paths,
  features,
  account,
}: {
  user: JWTUserData;

  account?: {
    id: string | null;
    name: string | null;
    picture_url: string | null;
  };

  signOutRequested: () => unknown;

  paths: {
    home: string;
    dashboard?: string;
    settings?: string;
    billing?: string;
    teams?: string;
    help?: string;
  };

  features: {
    enableBilling?: boolean;
    enableTeams?: boolean;
    enableThemeToggle?: boolean; // Kept for backwards compatibility
  };

  showProfileName?: boolean;

  className?: string;
}) {
  const { data: personalAccountData } = usePersonalAccountData(
    user.id,
    account,
  );

  const signedInAsLabel = useMemo(() => {
    const email = user?.email ?? undefined;
    const phone = user?.phone ?? undefined;

    return email ?? phone;
  }, [user]);

  const displayName =
    personalAccountData?.name ?? account?.name ?? user?.email ?? '';

  const isSuperAdmin = useMemo(() => {
    const hasAdminRole = user?.app_metadata.role === 'super-admin';
    const isAal2 = user?.aal === 'aal2';

    return hasAdminRole && isAal2;
  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open your profile menu"
        data-test={'account-dropdown-trigger'}
        className={cn(
          'group/trigger fade-in flex cursor-pointer items-center group-data-[minimized=true]/sidebar:px-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
          className ?? '',
          {
            ['items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800']:
              showProfileName,
          },
        )}
      >
        <ProfileAvatar
          className="h-8 w-8 rounded-lg bg-zinc-900 text-white transition-transform group-hover/trigger:scale-[1.02] dark:bg-zinc-100 dark:text-zinc-900"
          fallbackClassName="rounded-lg text-[13px] font-medium"
          displayName={displayName ?? user?.email ?? ''}
          pictureUrl={personalAccountData?.picture_url}
        />

        <If condition={showProfileName}>
          <div className="fade-in flex flex-1 flex-col truncate text-left group-data-[minimized=true]/sidebar:hidden">
            <span
              data-test={'account-dropdown-display-name'}
              className="truncate text-[15px] font-medium tracking-[-0.01em] text-zinc-900 dark:text-white"
            >
              {displayName}
            </span>
            <span
              data-test={'account-dropdown-email'}
              className="truncate text-[13px] tracking-[-0.02em] text-zinc-500 dark:text-zinc-400"
            >
              {signedInAsLabel}
            </span>
          </div>

          <ChevronIcon className="h-4 w-4 text-zinc-400 transition-colors group-hover/trigger:text-zinc-600 group-data-[minimized=true]/sidebar:hidden dark:text-zinc-500 dark:group-hover/trigger:text-zinc-300" />
        </If>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Dashboard - only show on marketing pages */}
        <If condition={!!paths.dashboard}>
          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
              href={paths.dashboard!}
            >
              <DashboardIcon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="my-1.5 bg-zinc-100 dark:bg-zinc-800" />
        </If>

        {/* Navigation Items */}
        <If condition={!!paths.settings}>
          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
              href={paths.settings!}
            >
              <SettingsIcon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </If>

        <If condition={features.enableBilling && !!paths.billing}>
          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
              href={paths.billing!}
            >
              <BillingIcon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Billing</span>
            </Link>
          </DropdownMenuItem>
        </If>

        <If condition={features.enableTeams && !!paths.teams}>
          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
              href={paths.teams!}
            >
              <TeamsIcon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Teams</span>
            </Link>
          </DropdownMenuItem>
        </If>

        <If condition={!!paths.help}>
          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
              href={paths.help!}
            >
              <HelpIcon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Help</span>
            </Link>
          </DropdownMenuItem>
        </If>

        <If condition={isSuperAdmin}>
          <DropdownMenuSeparator className="my-1.5 bg-zinc-100 dark:bg-zinc-800" />

          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
              href={'/admin'}
            >
              <div className="flex h-[18px] w-[18px] items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              </div>
              <span>Super Admin</span>
            </Link>
          </DropdownMenuItem>
        </If>

        <DropdownMenuSeparator className="my-1.5 bg-zinc-100 dark:bg-zinc-800" />

        <DropdownMenuItem
          data-test={'account-dropdown-sign-out'}
          role={'button'}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
          onClick={signOutRequested}
        >
          <SignOutIcon className="h-[18px] w-[18px] flex-shrink-0" />
          <span>Log out</span>
        </DropdownMenuItem>

        {/* Email at bottom */}
        <DropdownMenuSeparator className="my-1.5 bg-zinc-100 dark:bg-zinc-800" />
        <div className="px-3 py-2">
          <span className="block truncate text-[13px] text-zinc-400 dark:text-zinc-500">
            {signedInAsLabel}
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
