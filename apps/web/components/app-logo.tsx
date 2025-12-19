'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useTheme } from 'next-themes';

import { cn } from '@kit/ui/utils';

function LogoImage({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();

  const logoSrc =
    resolvedTheme === 'dark'
      ? '/images/sparlo-grid-logo-white.png'
      : '/images/sparlo-grid-logo-black.png';

  return (
    <Image
      src={logoSrc}
      alt="Sparlo"
      width={100}
      height={25}
      className={cn('h-6 w-auto', className)}
      priority
    />
  );
}

export function AppLogo({
  href,
  label,
  className,
}: {
  href?: string | null;
  className?: string;
  label?: string;
}) {
  if (href === null) {
    return <LogoImage className={className} />;
  }

  return (
    <Link
      aria-label={label ?? 'Home Page'}
      href={href ?? '/'}
      prefetch={true}
      className="transition-opacity hover:opacity-70"
    >
      <LogoImage className={className} />
    </Link>
  );
}
