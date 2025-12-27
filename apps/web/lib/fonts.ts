import localFont from 'next/font/local';

import { cn } from '@kit/ui/utils';

/**
 * @sans
 * @description Söhne font (primary brand typeface).
 * Söhne license required. Place font files in /public/fonts/:
 * - Soehne-Buch.woff2 (400)
 * - Soehne-Kraeftig.woff2 (500)
 * - Soehne-halbFett.woff2 (600)
 */
const soehne = localFont({
  src: [
    {
      path: '../public/fonts/Soehne-Buch.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Soehne-Kraeftig.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Soehne-halbFett.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

// Primary font (Söhne)
const sans = soehne;

/**
 * @mono
 * @description Söhne Mono font (monospace typeface).
 * Söhne license required. Place font files in /public/fonts/:
 * - Soehne-Mono-Buch.woff2 (400)
 * - Soehne-Mono-Kraeftig.woff2 (500)
 * - Soehne-Mono-halbFett.woff2 (600)
 */
const mono = localFont({
  src: [
    {
      path: '../public/fonts/Soehne-Mono-Buch.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Soehne-Mono-Kraeftig.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Soehne-Mono-halbFett.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace'],
});

/**
 * @heading
 * @description Suisse Intl for page titles and headings.
 * Using Regular weight (400) with -0.02em tracking.
 */
const heading = localFont({
  src: [
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-heading',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

// we export these fonts into the root layout
export { sans, heading, mono };

/**
 * @name getFontsClassName
 * @description Get the class name for the root layout.
 */
export function getFontsClassName(theme?: string) {
  const dark = theme === 'dark';
  const light = !dark;

  const font = [sans.variable, heading.variable, mono.variable].reduce<
    string[]
  >((acc, curr) => {
    if (acc.includes(curr)) return acc;
    return [...acc, curr];
  }, []);

  return cn(...font, {
    dark,
    light,
  });
}
