'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { FileText, Home, Settings } from 'lucide-react';

import { cn } from '@kit/ui/utils';

import { AppLogo } from '~/components/app-logo';

import { UsageIndicator } from './usage-indicator';
import { UserMenu } from './user-menu';

const NAV_LINKS = [
  { href: '/home', label: 'Dashboard', icon: Home },
  { href: '/home/reports/new', label: 'New Report', icon: FileText },
  { href: '/home/settings', label: 'Settings', icon: Settings },
] as const;

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
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
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
                <span className="hidden lg:inline">{label}</span>
                {/* Screen reader text for tablet */}
                <span className="sr-only lg:hidden">{label}</span>
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
