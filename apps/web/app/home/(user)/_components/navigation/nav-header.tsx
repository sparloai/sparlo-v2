'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { CreditCard, LogOut, Settings } from 'lucide-react';

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

  const handleSignOut = async () => {
    await signOutMutation.mutateAsync();
    router.push('/');
  };

  const initials =
    workspace?.name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  return (
    <header className="border-b border-[#1E1E21] bg-[#111113]">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-6">
          <Link href="/home" className="transition-opacity hover:opacity-70">
            <Image
              src="/images/sparlo-logo-white.png"
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
                      ? 'text-[#FAFAFA]'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA]',
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
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2E] bg-[#1E1E21] transition-colors hover:border-[#3A3A3F]"
              aria-label="Account menu"
            >
              <span
                className="text-[12px] font-medium text-[#A1A1AA]"
                style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
              >
                {initials}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-48 border-[#2A2A2E] bg-[#1E1E21]"
          >
            <DropdownMenuItem asChild>
              <Link
                href="/home/settings"
                className="cursor-pointer text-[#FAFAFA] focus:bg-[#2A2A2E] focus:text-[#FAFAFA]"
              >
                <Settings className="mr-2 h-4 w-4" />
                <Trans i18nKey="common:routes.settings" />
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/home/settings/billing"
                className="cursor-pointer text-[#FAFAFA] focus:bg-[#2A2A2E] focus:text-[#FAFAFA]"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                <Trans i18nKey="common:routes.billing" />
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-[#2A2A2E]" />

            {/* Theme Toggle */}
            <SubMenuModeToggle />

            <DropdownMenuSeparator className="bg-[#2A2A2E]" />

            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signOutMutation.isPending}
              className="cursor-pointer text-[#EF4444] focus:bg-[#2A2A2E] focus:text-[#EF4444]"
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
