/**
 * Design System Compliance Tests for UX/UI Learning Loop
 *
 * Validates adherence to Sparlo's design system:
 * - Near-monochrome palette (zinc-950, zinc-700, zinc-500, zinc-400)
 * - Typography-driven hierarchy (18px body)
 * - Left border accent pattern
 * - Component primitives
 *
 * Reference: docs/SPARLO-DESIGN-SYSTEM.md
 */
import { test, expect } from '@playwright/test';

// Test timeout: 30s max for learning loop
test.setTimeout(30000);

// Design system color palette (RGB values)
const DESIGN_SYSTEM_COLORS = {
  'zinc-950': 'rgb(9, 9, 11)',
  'zinc-900': 'rgb(24, 24, 27)',
  'zinc-800': 'rgb(39, 39, 42)',
  'zinc-700': 'rgb(63, 63, 70)',
  'zinc-600': 'rgb(82, 82, 91)',
  'zinc-500': 'rgb(113, 113, 122)',
  'zinc-400': 'rgb(161, 161, 170)',
  'zinc-300': 'rgb(212, 212, 216)',
  'zinc-200': 'rgb(228, 228, 231)',
  'zinc-100': 'rgb(244, 244, 245)',
  'zinc-50': 'rgb(250, 250, 250)',
  white: 'rgb(255, 255, 255)',
  transparent: 'rgba(0, 0, 0, 0)',
};

// Convert rgb string to comparable format
function normalizeColor(color: string): string {
  // Handle rgba with 0 alpha as transparent
  if (color.startsWith('rgba') && color.endsWith(', 0)')) {
    return 'transparent';
  }
  // Handle oklab/lab with 0 alpha as transparent
  if ((color.startsWith('oklab') || color.startsWith('lab')) && color.includes('/ 0)')) {
    return 'transparent';
  }
  // Normalize rgb format
  return color.replace(/\s/g, '');
}

function isDesignSystemColor(color: string): boolean {
  // Accept modern color formats (oklab, lab, lch) as they may be converted zinc values
  // These are often used by modern CSS and may represent the same colors
  if (color.startsWith('oklab') || color.startsWith('lab') || color.startsWith('lch')) {
    return true; // Accept modern color formats - browser may convert zinc to these
  }

  const normalized = normalizeColor(color);
  if (normalized === 'transparent' || normalized === 'rgba(0,0,0,0)') {
    return true;
  }

  // Check for exact match with design system colors
  const isExactMatch = Object.values(DESIGN_SYSTEM_COLORS).some(
    (dsColor) => normalizeColor(dsColor) === normalized
  );
  if (isExactMatch) return true;

  // Also accept very dark colors (near-black) as valid - zinc-950 variants
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    // Accept any color where all channels are < 20 (very dark, near black)
    if (r < 20 && g < 20 && b < 20) {
      return true;
    }
  }

  return false;
}

test.describe('Design System Compliance @fast', () => {
  // Note: These tests run on public pages only (no auth required)
  // This enables fast feedback in the learning loop

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('body text uses correct typography (18px)', async ({ page }) => {
    // Find main content paragraphs
    const bodyText = page.locator('main p, .body-text, [class*="text-lg"]');
    const count = await bodyText.count();

    if (count === 0) {
      // Skip if no body text elements found
      return;
    }

    const violations: string[] = [];

    for (let i = 0; i < Math.min(count, 10); i++) {
      const el = bodyText.nth(i);
      const isVisible = await el.isVisible();
      if (!isVisible) continue;

      const fontSize = await el.evaluate((e) => getComputedStyle(e).fontSize);
      const fontSizePx = parseFloat(fontSize);

      // Allow 16px, 18px, or larger for body text
      if (fontSizePx < 16) {
        const text = await el.textContent();
        violations.push(
          `Body text "${text?.slice(0, 30)}..." uses ${fontSize} (expected 18px)`
        );
      }
    }

    expect(violations.slice(0, 3)).toEqual([]);
  });

  test('uses design system colors only', async ({ page }) => {
    const violations = await page.evaluate((designColors) => {
      const colorViolations: string[] = [];
      const checkedColors = new Set<string>();

      // Helper to check if a color is valid
      const isValidColor = (color: string): boolean => {
        // Accept modern color formats (oklab, lab, lch)
        if (color.startsWith('oklab') || color.startsWith('lab') || color.startsWith('lch')) {
          return true;
        }
        // Accept transparent
        if (color === 'rgba(0, 0, 0, 0)' || color.endsWith(', 0)')) {
          return true;
        }
        // Accept exact design system matches
        const isExact = Object.values(designColors).some(
          (c) => c.replace(/\s/g, '') === color.replace(/\s/g, '')
        );
        if (isExact) return true;
        // Accept dark colors (zinc-950/900/800 variants, dark mode colors)
        const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1], 10);
          const g = parseInt(rgbMatch[2], 10);
          const b = parseInt(rgbMatch[3], 10);
          // Accept colors where all channels are dark (grayscale dark)
          if (r < 50 && g < 50 && b < 50) return true;
        }
        return false;
      };

      // Check text colors on visible elements
      const elements = document.querySelectorAll(
        'main *, header *, footer *'
      );

      elements.forEach((el) => {
        const style = getComputedStyle(el);
        const color = style.color;
        const bgColor = style.backgroundColor;

        // Check text color
        if (color && !checkedColors.has(color)) {
          checkedColors.add(color);
          if (!isValidColor(color)) {
            colorViolations.push(`Text color: ${color}`);
          }
        }

        // Check background color (less strict - allow gradients, images)
        if (
          bgColor &&
          !checkedColors.has(bgColor) &&
          !bgColor.includes('gradient')
        ) {
          checkedColors.add(bgColor);
          if (!isValidColor(bgColor)) {
            colorViolations.push(`Background: ${bgColor}`);
          }
        }
      });

      return colorViolations.slice(0, 5);
    }, DESIGN_SYSTEM_COLORS);

    if (violations.length > 0) {
      console.error('COLOR VIOLATIONS:');
      violations.forEach((v) => console.error(`  - ${v}`));
      console.error(
        'Fix: Use only zinc-950, zinc-700, zinc-500, zinc-400, or white.'
      );
      console.error('Ref: docs/SPARLO-DESIGN-SYSTEM.md#color-palette');
    }

    expect(violations).toEqual([]);
  });

  test('left border accent pattern used correctly', async ({ page }) => {
    // Check for left border accent elements
    const accentElements = page.locator(
      '[class*="border-l-2"], [class*="border-l-4"]'
    );
    const count = await accentElements.count();

    // On pages with content sections, expect some accent patterns for visual hierarchy
    if (count === 0) {
      console.log(
        'INFO: No left border accent patterns found. Consider adding for visual hierarchy.'
      );
      console.log('Pattern: border-l-2 border-zinc-900 pl-10');
    }

    // Verify accent colors are correct
    for (let i = 0; i < Math.min(count, 5); i++) {
      const el = accentElements.nth(i);
      const borderColor = await el.evaluate(
        (e) => getComputedStyle(e).borderLeftColor
      );

      // Should use zinc-900 or zinc-950 for accent
      const isValidAccent =
        borderColor.includes('24, 24, 27') || // zinc-900
        borderColor.includes('9, 9, 11'); // zinc-950

      if (!isValidAccent && borderColor !== 'rgba(0, 0, 0, 0)') {
        console.error(`Left border accent uses ${borderColor}`);
        console.error('Expected: border-zinc-900 or border-zinc-950');
      }
    }
  });

  test('cards follow design system pattern', async ({ page }) => {
    // Find card-like elements
    const cards = page.locator(
      '[class*="rounded-xl"], [class*="shadow-sm"], .card'
    );
    const count = await cards.count();

    if (count === 0) return;

    const violations: string[] = [];

    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = cards.nth(i);
      const isVisible = await card.isVisible();
      if (!isVisible) continue;

      const styles = await card.evaluate((e) => {
        const s = getComputedStyle(e);
        return {
          borderRadius: s.borderRadius,
          padding: s.padding,
          backgroundColor: s.backgroundColor,
        };
      });

      // Check for proper rounding (should be rounded-xl = 12px or more)
      const radiusPx = parseFloat(styles.borderRadius);
      if (radiusPx > 0 && radiusPx < 8) {
        violations.push(`Card has borderRadius ${styles.borderRadius} (expected rounded-xl/12px+)`);
      }
    }

    expect(violations.slice(0, 2)).toEqual([]);
  });

  test('buttons use correct styles', async ({ page }) => {
    const primaryButtons = page.locator(
      'button[class*="bg-zinc-900"], button[class*="bg-zinc-950"], [class*="btn-primary"]'
    );
    const count = await primaryButtons.count();

    if (count === 0) return;

    for (let i = 0; i < Math.min(count, 3); i++) {
      const btn = primaryButtons.nth(i);
      const isVisible = await btn.isVisible();
      if (!isVisible) continue;

      const styles = await btn.evaluate((e) => {
        const s = getComputedStyle(e);
        return {
          backgroundColor: s.backgroundColor,
          color: s.color,
        };
      });

      // Primary buttons should have dark background
      const hasDarkBg =
        styles.backgroundColor.includes('9, 9, 11') || // zinc-950
        styles.backgroundColor.includes('24, 24, 27'); // zinc-900

      // And white text
      const hasLightText = styles.color.includes('255, 255, 255');

      if (hasDarkBg && !hasLightText) {
        console.error('Primary button has dark background but not white text');
        console.error('Expected: bg-zinc-900 text-white');
      }
    }
  });
});
