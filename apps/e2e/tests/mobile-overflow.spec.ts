import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'https://sparlo.ai';

// Skip auth - this tests public landing page
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Mobile Horizontal Overflow Check', () => {
  test('mobile: no horizontal scroll on landing page', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Dismiss cookie banner if present
    const gotItButton = page.getByText('Got it');
    if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotItButton.click();
    }

    // Scroll through the page vertically first
    const scrollPositions = [0, 500, 1000, 1500, 2000, 2500, 3000];
    for (const scrollY of scrollPositions) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(100);
    }

    // Go back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // Check if horizontal scroll is possible
    const scrollInfo = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;

      // Try to scroll right
      window.scrollTo(100, 0);
      const scrolledX = window.scrollX;

      // Reset
      window.scrollTo(0, 0);

      return {
        maxScrollX: Math.max(
          html.scrollWidth - html.clientWidth,
          body.scrollWidth - body.clientWidth,
        ),
        actualScrollX: scrolledX,
        htmlScrollWidth: html.scrollWidth,
        htmlClientWidth: html.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        canScrollHorizontally: scrolledX > 0,
      };
    });

    console.log('Mobile Horizontal Scroll Check:');
    console.log(`  HTML scrollWidth: ${scrollInfo.htmlScrollWidth}px`);
    console.log(`  HTML clientWidth: ${scrollInfo.htmlClientWidth}px`);
    console.log(`  Body scrollWidth: ${scrollInfo.bodyScrollWidth}px`);
    console.log(`  Body clientWidth: ${scrollInfo.bodyClientWidth}px`);
    console.log(`  Max scroll X: ${scrollInfo.maxScrollX}px`);
    console.log(`  Actual scroll X after attempt: ${scrollInfo.actualScrollX}px`);
    console.log(`  Can scroll horizontally: ${scrollInfo.canScrollHorizontally}`);

    // Take screenshot
    await page.screenshot({
      path: 'tests/screenshots/mobile-overflow-check.png',
      fullPage: true,
    });

    // Assert no horizontal scrolling is possible
    expect(
      scrollInfo.canScrollHorizontally,
      `Page can scroll horizontally by ${scrollInfo.actualScrollX}px (max: ${scrollInfo.maxScrollX}px)`,
    ).toBe(false);
  });

  test('mobile: check each section for overflow', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Dismiss cookie banner if present
    const gotItButton = page.getByText('Got it');
    if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotItButton.click();
    }

    // Scroll through page and check overflow at each position
    const scrollPositions = [0, 500, 1000, 1500, 2000, 2500, 3000];
    const viewportWidth = 393;

    for (const scrollY of scrollPositions) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(200);

      const sectionOverflow = await page.evaluate((vpWidth) => {
        const elements = document.elementsFromPoint(vpWidth / 2, window.innerHeight / 2);
        const overflowing: string[] = [];

        document.querySelectorAll('*').forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            // Element is in viewport
            if (rect.right > vpWidth + 5) {
              const tag = el.tagName.toLowerCase();
              const className = el.className
                ? `.${String(el.className).split(' ').slice(0, 2).join('.')}`
                : '';
              overflowing.push(
                `${tag}${className} (overflow: ${(rect.right - vpWidth).toFixed(0)}px)`,
              );
            }
          }
        });

        return overflowing.slice(0, 10);
      }, viewportWidth);

      if (sectionOverflow.length > 0) {
        console.log(`Overflow at scroll position ${scrollY}:`);
        sectionOverflow.forEach((el) => console.log(`  - ${el}`));

        await page.screenshot({
          path: `tests/screenshots/mobile-overflow-at-${scrollY}.png`,
          fullPage: false,
        });
      }
    }
  });
});
