'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { CreditCard, LogOut, Settings } from 'lucide-react';
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
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { useAppWorkspace } from '../../_lib/app-workspace-context';

const NAV_ITEMS = [
  { href: '/home', label: 'Dashboard' },
  { href: '/home/reports/new', label: 'New Analysis' },
];

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace } = useAppWorkspace();
  const signOutMutation = useSignOut();
  const { resolvedTheme } = useTheme();

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
      ? '/images/sparlo-logo-white.png'
      : '/images/sparlo-logo-black.png';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'border-b border-[--nav-border]',
        'bg-[--nav-bg] backdrop-blur-[12px]',
        'shadow-[--nav-shadow]',
        'transition-colors duration-200',
        'supports-[not(backdrop-filter)]:bg-[--nav-bg-solid]',
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-6">
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

          {/* Nav Links */}
          <div className="flex items-center gap-5">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive =
                href === '/home'
                  ? pathname === '/home'
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'text-[14px] transition-colors',
                    isActive
                      ? 'text-[--text-primary]'
                      : 'text-[--text-muted] hover:text-[--text-primary]',
                  )}
                  style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Avatar with dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[--border-default] bg-[--surface-overlay] transition-colors hover:border-[--border-strong]"
              aria-label="Account menu"
            >
              <span
                className="text-[12px] font-medium text-[--text-muted]"
                style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
              >
                {initials}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-48 border-[--border-default] bg-[--surface-elevated]"
          >
            <DropdownMenuItem asChild>
              <Link
                href="/home/settings"
                className="cursor-pointer text-[--text-primary] focus:bg-[--surface-overlay] focus:text-[--text-primary]"
              >
                <Settings className="mr-2 h-4 w-4" />
                <Trans i18nKey="common:routes.settings" />
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/home/settings/billing"
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
      </nav>
    </header>
  );
}
