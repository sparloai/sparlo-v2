'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useTheme } from 'next-themes';

import { cn } from '@kit/ui/utils';

interface LandingNavHeaderProps {
  actions?: React.ReactNode;
}

export function LandingNavHeader({ actions }: LandingNavHeaderProps) {
  const { resolvedTheme } = useTheme();

  const logoSrc =
    resolvedTheme === 'dark'
      ? '/images/sparlo-grid-logo-white.png'
      : '/images/sparlo-grid-logo-black.png';

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-50',
        'border-b border-[--nav-border]',
        'bg-[--nav-bg] backdrop-blur-[var(--nav-blur)]',
        'shadow-[--nav-shadow]',
        'transition-colors duration-200',
        'supports-[not(backdrop-filter)]:bg-[--nav-bg-solid]',
      )}
    >
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="transition-opacity hover:opacity-70">
            <Image
              src={logoSrc}
              alt="Sparlo"
              width={80}
              height={20}
              className="h-5 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">{actions}</div>
      </nav>
    </header>
  );
}
