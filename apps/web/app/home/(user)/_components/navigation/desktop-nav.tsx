'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Trans } from '@kit/ui/trans';
import { cn } from '@kit/ui/utils';

import { AppLogo } from '~/components/app-logo';

import { NAV_LINKS } from './nav-links';
import { UsageIndicator } from './usage-indicator';
import { UserMenu } from './user-menu';

export function DesktopNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn('w-full items-center justify-between', className)}>
      {/* Left: Logo + Nav Links */}
      <div className="flex items-center gap-6 lg:gap-8">
        <Link href="/home" className="flex-shrink-0">
          <AppLogo />
        </Link>

        <div className="flex items-center gap-4 lg:gap-6">
          {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
            const isActive =
              href === '/home'
                ? pathname === '/home'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 transition-colors',
                  isActive
                    ? 'font-medium text-[--accent]'
                    : 'text-[--text-secondary] hover:text-[--text-primary]',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {/* Hide label on tablet, show on desktop */}
                <span className="hidden lg:inline">
                  <Trans i18nKey={labelKey} />
                </span>
                {/* Screen reader text for tablet */}
                <span className="sr-only lg:hidden">
                  <Trans i18nKey={labelKey} />
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: Usage + User Menu */}
      <div className="flex items-center gap-3 lg:gap-4">
        <UsageIndicator />
        <UserMenu />
      </div>
    </nav>
  );
}
