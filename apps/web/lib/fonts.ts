import localFont from 'next/font/local';

import { cn } from '@kit/ui/utils';

/**
 * @sans
 * @description Suisse Intl - primary brand typeface for all text.
 * Place font files in /public/fonts/Suisse/WOFF2/
 */
const suisseIntl = localFont({
  src: [
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Book.woff2',
      weight: '450',
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
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

// Primary font (Suisse Intl)
const sans = suisseIntl;

/**
 * @mono
 * @description System monospace font stack for code blocks.
 */
const mono = localFont({
  src: [
    {
      path: '../public/fonts/Suisse/WOFF2/SuisseIntlTrial-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-mono',
  display: 'swap',
  fallback: ['Suisse Mono', 'SF Mono', 'ui-monospace', 'monospace'],
});

/**
 * @heading
 * @description Suisse Intl for page titles and headings.
 * Same as sans - unified typeface across the site.
 */
const heading = suisseIntl;

// we export these fonts into the root layout
export { sans, heading, mono };

// ============================================
// FONT FAMILY STRING CONSTANTS
// ============================================

/** Suisse Intl with system fallbacks */
export const FONT_HEADING =
  "'Suisse Intl', -apple-system, BlinkMacSystemFont, sans-serif";

/** Suisse Intl (body) with system fallbacks */
export const FONT_BODY = "'Suisse Intl', -apple-system, BlinkMacSystemFont, sans-serif";

/** System monospace with fallbacks */
export const FONT_MONO = "'Suisse Mono', 'SF Mono', ui-monospace, monospace";

/** CSS style objects for direct use in style props */
export const fontStyles = {
  heading: { fontFamily: FONT_HEADING } as const,
  body: { fontFamily: FONT_BODY } as const,
  mono: { fontFamily: FONT_MONO } as const,
} as const;

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
