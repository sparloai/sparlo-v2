'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { getAppPath } from '~/lib/hooks/use-app-path';

type AppLinkProps = ComponentProps<typeof Link>;

/**
 * A Link component that automatically converts /home/* paths to clean paths
 * when on the app subdomain (app.sparlo.ai).
 *
 * Usage: Replace `<Link href="/home/reports">` with `<AppLink href="/home/reports">`
 * On app.sparlo.ai, this renders as `/reports`
 * On sparlo.ai, this renders as `/home/reports`
 */
export function AppLink({ href, ...props }: AppLinkProps) {
  const hrefString = typeof href === 'string' ? href : href.pathname ?? '';
  const convertedHref = getAppPath(hrefString);

  // If href was an object, preserve the other properties
  const finalHref =
    typeof href === 'object' ? { ...href, pathname: convertedHref } : convertedHref;

  return <Link href={finalHref} {...props} />;
}
