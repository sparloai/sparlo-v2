'use client';

import Link from 'next/link';

import { CreditCard, LogOut, User } from 'lucide-react';

import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';

export function UserMenu() {
  const { user, workspace } = useUserWorkspace();

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
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/home/settings/billing" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            Billing
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action="/auth/sign-out" method="POST" className="w-full">
            <button
              type="submit"
              className="flex w-full items-center text-[--status-error]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
