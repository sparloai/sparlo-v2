'use client';

import type { ComponentProps } from 'react';

import Link from 'next/link';

import { useAppPath } from '~/lib/hooks/use-app-path';

type AppLinkProps = ComponentProps<typeof Link>;

/**
 * A Link component that automatically converts /home/* paths to clean paths.
 *
 * Usage: Replace `<Link href="/app/reports">` with `<AppLink href="/app/reports">`
 */
export function AppLink({ href, ...props }: AppLinkProps) {
  const { getPath } = useAppPath();

  const hrefString = typeof href === 'string' ? href : (href.pathname ?? '');
  const convertedHref = getPath(hrefString);

  // If href was an object, preserve the other properties
  const finalHref =
    typeof href === 'object'
      ? { ...href, pathname: convertedHref }
      : convertedHref;

  return <Link href={finalHref} {...props} />;
}
