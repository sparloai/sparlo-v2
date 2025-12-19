'use client';

import { DesktopNav } from './desktop-nav';
import { MobileNav } from './mobile-nav';

export function NavHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[--border-subtle] bg-[--surface-elevated] md:bg-[--surface-elevated]/80 md:backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Desktop + Tablet: hidden on mobile */}
        <DesktopNav className="hidden md:flex" />

        {/* Mobile: visible only on mobile */}
        <MobileNav className="flex md:hidden" />
      </div>
    </header>
  );
}
