import { Inter as InterFont } from 'next/font/google';
import localFont from 'next/font/local';

import { cn } from '@kit/ui/utils';

/**
 * @sans
 * @description Söhne font with Inter fallback.
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
  fallback: ['Söhne', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

/**
 * @inter (fallback)
 * @description Inter font as system fallback when Söhne isn't available.
 */
const inter = InterFont({
  subsets: ['latin'],
  variable: '--font-sans-fallback',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

// Primary font (Söhne with Inter fallback)
const sans = soehne;

/**
 * @heading
 * @description Heading font (same as sans for brand consistency).
 */
const heading = sans;

// we export these fonts into the root layout
export { sans, heading, inter };

/**
 * @name getFontsClassName
 * @description Get the class name for the root layout.
 * Includes both Söhne (primary) and Inter (fallback) font variables.
 */
export function getFontsClassName(theme?: string) {
  const dark = theme === 'dark';
  const light = !dark;

  const font = [sans.variable, heading.variable, inter.variable].reduce<
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
