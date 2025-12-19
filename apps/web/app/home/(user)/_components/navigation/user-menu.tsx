'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { CreditCard, LogOut, Settings, User } from 'lucide-react';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { SubMenuModeToggle } from '@kit/ui/mode-toggle';
import { Trans } from '@kit/ui/trans';

import { useAppWorkspace } from '../../_lib/app-workspace-context';

export function UserMenu() {
  const { user, workspace } = useAppWorkspace();
  const router = useRouter();
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-[--surface-overlay]">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={workspace?.picture_url ?? undefined}
              alt={workspace?.name ?? 'User'}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {/* Show name on desktop only */}
          <span className="hidden max-w-[120px] truncate text-sm font-medium lg:inline">
            {workspace?.name ?? 'User'}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href="/home/settings" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <Trans i18nKey="common:routes.profile" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/home/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <Trans i18nKey="common:routes.settings" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/home/settings/billing" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <Trans i18nKey="common:routes.billing" />
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme Toggle */}
        <SubMenuModeToggle />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          disabled={signOutMutation.isPending}
          className="cursor-pointer text-[--status-error] focus:text-[--status-error]"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <Trans i18nKey="common:nav.signOut" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
