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
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { usePersonalAccountData } from '../hooks/use-personal-account-data';

/**
 * Minimal icon components following Sparlo design system
 * Consistent 1.5px stroke, 24x24 viewBox
 */
function GridIcon({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
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

function SunMoonIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
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
    settings?: string;
    billing?: string;
  };

  features: {
    enableThemeToggle: boolean;
    enableBilling?: boolean;
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
        {/* User Info Header */}
        <div className="border-l-2 border-zinc-900 px-3 py-3 dark:border-zinc-100">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase dark:text-zinc-500">
            <Trans i18nKey={'common:signedInAs'} />
          </span>
          <span className="block truncate text-[15px] font-medium tracking-[-0.01em] text-zinc-900 dark:text-white">
            {signedInAsLabel}
          </span>
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-zinc-100 dark:bg-zinc-800" />

        {/* Navigation Items */}
        <DropdownMenuItem asChild>
          <Link
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
            href={paths.home}
          >
            <GridIcon className="h-[18px] w-[18px] flex-shrink-0" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
            href={'/docs'}
          >
            <HelpIcon className="h-[18px] w-[18px] flex-shrink-0" />
            <span>Help & Docs</span>
          </Link>
        </DropdownMenuItem>

        <If condition={features.enableThemeToggle}>
          <DropdownMenuSeparator className="my-1.5 bg-zinc-100 dark:bg-zinc-800" />

          <DropdownMenuItem asChild>
            <Link
              className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:focus:bg-zinc-800"
              href={paths.settings ? `${paths.settings}#appearance` : '#'}
            >
              <SunMoonIcon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>Theme</span>
              <span className="ml-auto text-[13px] text-zinc-400 dark:text-zinc-500">
                →
              </span>
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
          <span>
            <Trans i18nKey={'auth:signOut'} />
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
