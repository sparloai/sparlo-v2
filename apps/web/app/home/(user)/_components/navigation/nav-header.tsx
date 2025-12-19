'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { LogOut, Settings } from 'lucide-react';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Trans } from '@kit/ui/trans';

import { useAppWorkspace } from '../../_lib/app-workspace-context';

const PAGE_NAMES: Record<string, string> = {
  '/home': 'Dashboard',
  '/home/reports/new': 'New Analysis',
  '/home/reports': 'Report',
  '/home/settings': 'Settings',
};

function getPageName(pathname: string): string {
  // Check exact matches first
  if (PAGE_NAMES[pathname]) return PAGE_NAMES[pathname];

  // Check prefix matches (e.g., /home/reports/123)
  if (pathname.startsWith('/home/reports/')) return 'Report';
  if (pathname.startsWith('/home/settings')) return 'Settings';

  return '';
}

export function NavHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace } = useAppWorkspace();
  const signOutMutation = useSignOut();
  const pageName = getPageName(pathname);

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
        {/* Left: Wordmark + Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href="/home"
            className="transition-opacity hover:opacity-70"
          >
            {/* White logo for dark mode, black logo for light mode */}
            <Image
              src="/images/sparlo-logo-white.png"
              alt="Sparlo"
              width={80}
              height={20}
              className="h-5 w-auto dark:block"
              priority
            />
          </Link>

          {pageName && pathname !== '/home' && (
            <>
              <span className="text-[14px] text-[#333]">/</span>
              <span
                className="text-[14px] text-[#666]"
                style={{ fontFamily: 'Soehne, Inter, sans-serif' }}
              >
                {pageName}
              </span>
            </>
          )}
        </div>

        {/* Right: Avatar only */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2A2A2E] bg-[#1E1E21] transition-colors hover:border-[#3A3A3F]"
              aria-label="Account menu"
            >
              <span
                className="text-[12px] font-medium text-[#666]"
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
