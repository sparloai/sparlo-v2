import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/mobile-reports';

/**
 * Mobile Report Reading Experience UX Audit
 *
 * Tests the mobile-optimized report display:
 * - No horizontal scrolling
 * - Full-width content (no sidebar taking space)
 * - Hamburger menu for navigation
 * - Proper touch targets
 * - Readable typography
 */

test.describe('Mobile Report Reading Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (iPhone 14 Pro)
    await page.setViewportSize({ width: 393, height: 852 });
  });

  test('Full mobile reports UX audit', async ({ page }) => {
    // Login
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
    await page.fill('input[name="password"]', 'Linguine2025');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Screenshot: Home/Reports List on Mobile
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-reports-list-mobile.png`,
      fullPage: true,
    });

    console.log('\n=== REPORTS LIST MOBILE AUDIT ===');

    // Check for horizontal scroll on reports list
    const reportsListScrollWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    console.log(`Horizontal scroll on reports list: ${reportsListScrollWidth ? 'YES (BAD)' : 'NO (GOOD)'}`);

    // Check sidebar is hidden on mobile
    const sidebarVisible = await page.locator('aside').isVisible().catch(() => false);
    console.log(`Sidebar visible on mobile: ${sidebarVisible ? 'YES (BAD - should be hidden)' : 'NO (GOOD)'}`);

    // Check hamburger menu exists
    const hamburgerButton = page.locator('button[aria-label="Open menu"]');
    const hamburgerExists = await hamburgerButton.isVisible().catch(() => false);
    console.log(`Hamburger menu exists: ${hamburgerExists ? 'YES (GOOD)' : 'NO (BAD)'}`);

    // Screenshot: Hamburger menu visible
    if (hamburgerExists) {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-hamburger-visible.png` });
    }

    // Test hamburger menu opens drawer
    if (hamburgerExists) {
      await hamburgerButton.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-menu-drawer-open.png` });

      // Check drawer is full-height and shows navigation
      const drawerContent = page.locator('aside.fixed');
      const drawerVisible = await drawerContent.isVisible().catch(() => false);
      console.log(`Menu drawer opens: ${drawerVisible ? 'YES (GOOD)' : 'NO (check selector)'}`);

      // Close drawer
      const closeButton = page.locator('button[aria-label="Close menu"]');
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await page.waitForTimeout(400);
      }
    }

    // Navigate to a report
    const reportLink = page.locator('a[href*="/home/reports/"]').first();
    if (await reportLink.isVisible()) {
      await reportLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      console.log('\n=== REPORT VIEW MOBILE AUDIT ===');

      // Screenshot: Report page on mobile
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-report-view-mobile.png`,
        fullPage: true,
      });

      // Check for horizontal scroll
      const reportScrollWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`Horizontal scroll on report: ${reportScrollWidth ? 'YES (BAD)' : 'NO (GOOD)'}`);

      // Check main content is full-width (no left margin)
      const mainMarginLeft = await page.evaluate(() => {
        const main = document.querySelector('main');
        if (main) {
          const style = getComputedStyle(main);
          return parseInt(style.marginLeft, 10);
        }
        return -1;
      });
      console.log(`Main content left margin: ${mainMarginLeft}px ${mainMarginLeft === 0 ? '(GOOD - full width)' : '(check)'}`);

      // Check header is full-width
      const headerLeft = await page.evaluate(() => {
        const header = document.querySelector('header.fixed');
        if (header) {
          const style = getComputedStyle(header);
          return parseInt(style.left, 10);
        }
        return -1;
      });
      console.log(`Header left position: ${headerLeft}px ${headerLeft === 0 ? '(GOOD - full width)' : '(check)'}`);

      // Test readable font sizes
      const fontSizes = await page.evaluate(() => {
        const headings = document.querySelectorAll('h1, h2, h3');
        const paragraphs = document.querySelectorAll('p');

        const sizes: { element: string; size: string; tooSmall: boolean }[] = [];

        headings.forEach((h, i) => {
          const size = getComputedStyle(h).fontSize;
          sizes.push({
            element: `${h.tagName}[${i}]`,
            size,
            tooSmall: parseInt(size, 10) < 16,
          });
        });

        // Sample first 5 paragraphs
        Array.from(paragraphs)
          .slice(0, 5)
          .forEach((p, i) => {
            const size = getComputedStyle(p).fontSize;
            sizes.push({
              element: `P[${i}]`,
              size,
              tooSmall: parseInt(size, 10) < 14,
            });
          });

        return sizes;
      });

      console.log('\nFont sizes analysis:');
      fontSizes.forEach((item) => {
        console.log(`  ${item.element}: ${item.size} ${item.tooSmall ? '(TOO SMALL!)' : '(OK)'}`);
      });

      // Test touch targets (buttons should be at least 44x44)
      const touchTargets = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a');
        const smallTargets: { text: string; width: number; height: number }[] = [];

        buttons.forEach((btn) => {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (rect.width < 44 || rect.height < 44) {
              smallTargets.push({
                text: (btn.textContent || btn.getAttribute('aria-label') || '').slice(0, 30),
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              });
            }
          }
        });

        return smallTargets.slice(0, 10); // Return first 10
      });

      console.log('\nSmall touch targets (<44px):');
      if (touchTargets.length === 0) {
        console.log('  None found (GOOD)');
      } else {
        touchTargets.forEach((t) => {
          console.log(`  "${t.text}": ${t.width}x${t.height}px`);
        });
      }

      // Test hamburger still works on report page
      const hamburgerOnReport = page.locator('button[aria-label="Open menu"]');
      if (await hamburgerOnReport.isVisible().catch(() => false)) {
        await hamburgerOnReport.click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/05-menu-drawer-on-report.png` });
        console.log('\nHamburger menu works on report page: YES (GOOD)');

        // Test navigation back to reports list
        const allReportsLink = page.locator('a:has-text("All Reports")');
        if (await allReportsLink.isVisible().catch(() => false)) {
          console.log('All Reports link visible in drawer: YES (GOOD)');
        }

        // Close drawer by clicking backdrop
        const backdrop = page.locator('.fixed.inset-0.bg-black\\/50');
        if (await backdrop.isVisible().catch(() => false)) {
          await backdrop.click();
          await page.waitForTimeout(400);
        }
      }

      // Scroll test - check content flows properly
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-report-scrolled.png` });

      // Final horizontal scroll check after scroll
      const finalScrollWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth;
      });
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      console.log(`\nFinal scroll width check: ${finalScrollWidth}px vs viewport ${viewportWidth}px`);
      console.log(`Horizontal overflow: ${finalScrollWidth > viewportWidth ? 'YES (BAD)' : 'NO (GOOD)'}`);
    }

    console.log('\n=== MOBILE UX AUDIT COMPLETE ===');
  });

  test('Test various mobile viewports', async ({ page }) => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 14', width: 390, height: 844 },
      { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
      { name: 'Galaxy S21', width: 360, height: 800 },
      { name: 'Pixel 7', width: 412, height: 915 },
    ];

    // Login once
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
    await page.fill('input[name="password"]', 'Linguine2025');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Navigate to a report
    const reportLink = page.locator('a[href*="/home/reports/"]').first();
    if (await reportLink.isVisible()) {
      await reportLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    }

    console.log('\n=== VIEWPORT COMPATIBILITY TEST ===');

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      const sidebarVisible = await page.locator('aside:not([class*="z-50"])').isVisible().catch(() => false);
      const hamburgerVisible = await page.locator('button[aria-label="Open menu"]').isVisible().catch(() => false);

      console.log(`${viewport.name} (${viewport.width}x${viewport.height}):`);
      console.log(`  Horizontal scroll: ${hasHorizontalScroll ? 'YES (BAD)' : 'NO (GOOD)'}`);
      console.log(`  Sidebar hidden: ${!sidebarVisible ? 'YES (GOOD)' : 'NO (BAD)'}`);
      console.log(`  Hamburger menu: ${hamburgerVisible ? 'YES (GOOD)' : 'NO (BAD)'}`);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/viewport-${viewport.name.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true,
      });
    }
  });
});
