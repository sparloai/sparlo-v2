'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { motion } from 'framer-motion';
import { Settings, X } from 'lucide-react';

import { useSignOut } from '@kit/supabase/hooks/use-sign-out';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { SubMenuModeToggle } from '@kit/ui/mode-toggle';
import { Sheet, SheetContent, SheetTrigger } from '@kit/ui/sheet';
import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { AppLogo } from '~/components/app-logo';

import { useAppWorkspace } from '../../_lib/app-workspace-context';
import { NAV_LINKS } from './nav-links';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, workspace, reportsUsed, reportLimit } = useAppWorkspace();
  const signOutMutation = useSignOut();
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleNavClick = () => setOpen(false);

  const handleSignOut = async () => {
    await signOutMutation.mutateAsync();
    router.push('/');
  };

  const initials =
    workspace?.name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  // Animation variants - disabled when user prefers reduced motion
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.2 },
      };

  return (
    <div
      className={cn('relative w-full items-center justify-between', className)}
    >
      {/* Hamburger Button */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            className="-ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center p-2"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <HamburgerIcon
              open={open}
              prefersReducedMotion={prefersReducedMotion}
            />
          </button>
        </SheetTrigger>

        <SheetContent side="left" className="w-[280px] p-0">
          <motion.div {...motionProps} className="flex h-full flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[--border-subtle] p-4">
              <AppLogo />
              <button
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
                  const isActive =
                    href === '/home'
                      ? pathname === '/home'
                      : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                          isActive
                            ? 'bg-[--accent-muted] font-medium text-[--accent]'
                            : 'text-[--text-secondary] hover:bg-[--surface-overlay]',
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <Trans i18nKey={labelKey} />
                      </Link>
                    </li>
                  );
                })}
                {/* Settings link in mobile nav */}
                <li>
                  <Link
                    href="/home/settings"
                    onClick={handleNavClick}
                    className={cn(
                      'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-3 transition-colors',
                      pathname.startsWith('/home/settings')
                        ? 'bg-[--accent-muted] font-medium text-[--accent]'
                        : 'text-[--text-secondary] hover:bg-[--surface-overlay]',
                    )}
                    aria-current={
                      pathname.startsWith('/home/settings') ? 'page' : undefined
                    }
                  >
                    <Settings className="h-5 w-5" aria-hidden="true" />
                    <Trans i18nKey="common:routes.settings" />
                  </Link>
                </li>
              </ul>
            </nav>

            {/* Usage Section */}
            <div className="border-t border-[--border-subtle] p-4">
              <div className="mb-1 text-sm text-[--text-muted]">
                <Trans i18nKey="common:nav.usageThisMonth" />
              </div>
              <div className="text-lg font-medium">
                {reportsUsed} / {reportLimit}
              </div>
              <Link
                href="/home/settings/billing"
                onClick={handleNavClick}
                className="mt-2 inline-block text-sm text-[--accent] hover:underline"
              >
                <Trans i18nKey="common:nav.upgradePlan" />
              </Link>
            </div>

            {/* User Section */}
            <div className="border-t border-[--border-subtle] p-4">
              <div className="mb-4 flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={workspace?.picture_url ?? undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {workspace?.name ?? 'User'}
                  </div>
                  <div className="truncate text-sm text-[--text-muted]">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Theme Toggle for Mobile */}
              <div className="mb-4">
                <SubMenuModeToggle />
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signOutMutation.isPending}
                className="w-full rounded-lg px-3 py-2 text-left text-[--status-error] transition-colors hover:bg-[--surface-overlay] disabled:opacity-50"
              >
                <Trans i18nKey="common:nav.signOut" />
              </button>
            </div>
          </motion.div>
        </SheetContent>
      </Sheet>

      {/* Center: Logo */}
      <Link href="/home" className="absolute left-1/2 -translate-x-1/2">
        <AppLogo />
      </Link>

      {/* Right: Avatar */}
      <Link href="/home/settings" className="-mr-2 p-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={workspace?.picture_url ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}

function HamburgerIcon({
  open,
  prefersReducedMotion,
}: {
  open: boolean;
  prefersReducedMotion: boolean;
}) {
  if (prefersReducedMotion) {
    // Simple non-animated version
    return (
      <div className="relative flex h-4 w-5 flex-col justify-between">
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-4 w-5 flex-col justify-between">
      <motion.span
        className="block h-0.5 w-5 origin-center rounded-full bg-current"
        animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.span
        className="block h-0.5 w-5 rounded-full bg-current"
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.1 }}
      />
      <motion.span
        className="block h-0.5 w-5 origin-center rounded-full bg-current"
        animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
