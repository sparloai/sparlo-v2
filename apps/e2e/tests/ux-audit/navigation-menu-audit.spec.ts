import { test } from '@playwright/test';

const SITE_URL = 'https://sparlo.ai';
const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/navigation';
const TEST_EMAIL = 'swimakaswim@gmail.com';
const TEST_PASSWORD = 'Linguine2025';

test.describe('Navigation Menu Micro-Interactions', () => {

  test('1. Mobile Hamburger Menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Screenshot before opening
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-mobile-menu-closed.png`,
    });

    // Find and click hamburger menu
    const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"], [class*="hamburger"], button:has([class*="menu"])').first();

    if (await hamburger.isVisible().catch(() => false)) {
      // Analyze hamburger button styles
      const hamburgerStyles = await hamburger.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          width: computed.width,
          height: computed.height,
          padding: computed.padding,
        };
      });
      console.log('Hamburger Button Styles:', JSON.stringify(hamburgerStyles, null, 2));

      await hamburger.click();
      await page.waitForTimeout(500); // Let animation complete

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/02-mobile-menu-open.png`,
      });

      // Check for animation properties on the menu
      const menuPanel = page.locator('[class*="drawer"], [class*="sidebar"], [class*="menu-panel"], [role="dialog"], nav').first();
      if (await menuPanel.isVisible().catch(() => false)) {
        const menuStyles = await menuPanel.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transform: computed.transform,
            transition: computed.transition,
            opacity: computed.opacity,
            animation: computed.animation,
          };
        });
        console.log('Menu Panel Styles:', JSON.stringify(menuStyles, null, 2));
      }

      // Test menu link hovers
      const menuLinks = page.locator('nav a, [role="dialog"] a, [class*="drawer"] a');
      const linkCount = await menuLinks.count();
      console.log(`Found ${linkCount} menu links`);

      if (linkCount > 0) {
        for (let i = 0; i < Math.min(3, linkCount); i++) {
          const link = menuLinks.nth(i);
          if (await link.isVisible().catch(() => false)) {
            const linkText = await link.textContent();
            console.log(`Hovering menu link: ${linkText?.trim()}`);

            await link.hover();
            await page.waitForTimeout(200);
          }
        }
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/03-mobile-menu-link-hover.png`,
        });
      }

      // Close menu and capture animation
      await hamburger.click();
      await page.waitForTimeout(100); // Capture mid-animation
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-mobile-menu-closing.png`,
      });

      await page.waitForTimeout(400);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-mobile-menu-closed-after.png`,
      });
    } else {
      console.log('No hamburger menu found on mobile');
    }
  });

  test('2. Desktop Sidebar Navigation', async ({ page }) => {
    // Login first
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot initial sidebar state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/06-desktop-sidebar-initial.png`,
    });

    // Find sidebar
    const sidebar = page.locator('aside, nav, [class*="sidebar"]').first();

    if (await sidebar.isVisible().catch(() => false)) {
      // Get all sidebar links
      const sidebarLinks = sidebar.locator('a');
      const linkCount = await sidebarLinks.count();
      console.log(`Found ${linkCount} sidebar links`);

      // Test each link's hover state
      for (let i = 0; i < Math.min(5, linkCount); i++) {
        const link = sidebarLinks.nth(i);
        if (await link.isVisible().catch(() => false)) {
          const linkText = await link.textContent();

          // Get before hover styles
          const beforeStyles = await link.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              borderLeft: computed.borderLeft,
              transform: computed.transform,
            };
          });

          await link.hover();
          await page.waitForTimeout(200);

          // Get after hover styles
          const afterStyles = await link.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              backgroundColor: computed.backgroundColor,
              color: computed.color,
              borderLeft: computed.borderLeft,
              transform: computed.transform,
            };
          });

          console.log(`Link "${linkText?.trim()}":`);
          console.log('  Before:', JSON.stringify(beforeStyles));
          console.log('  After:', JSON.stringify(afterStyles));

          await page.screenshot({
            path: `${SCREENSHOT_DIR}/07-sidebar-link-${i + 1}-hover.png`,
          });
        }
      }
    }

    // Test hamburger/collapse button if exists
    const collapseBtn = page.locator('button[aria-label*="collapse"], button[aria-label*="menu"], [class*="collapse"]').first();
    if (await collapseBtn.isVisible().catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-sidebar-collapsed.png`,
      });
    }
  });

  test('3. Mobile Dashboard Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Login
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-mobile-dashboard-initial.png`,
    });

    // Find mobile menu trigger
    const mobileMenuBtn = page.locator('button').filter({ has: page.locator('svg') }).first();

    if (await mobileMenuBtn.isVisible().catch(() => false)) {
      await mobileMenuBtn.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/10-mobile-dashboard-menu-open.png`,
      });

      // Check for drawer animation
      const drawer = page.locator('[class*="drawer"], [class*="sheet"], [role="dialog"]').first();
      if (await drawer.isVisible().catch(() => false)) {
        const drawerStyles = await drawer.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transform: computed.transform,
            transition: computed.transition,
            animation: computed.animation,
            width: computed.width,
          };
        });
        console.log('Drawer Styles:', JSON.stringify(drawerStyles, null, 2));

        // Test drawer link hovers
        const drawerLinks = drawer.locator('a');
        const linkCount = await drawerLinks.count();
        console.log(`Found ${linkCount} drawer links`);

        for (let i = 0; i < Math.min(3, linkCount); i++) {
          const link = drawerLinks.nth(i);
          if (await link.isVisible().catch(() => false)) {
            // On mobile, test tap feedback instead of hover
            await link.tap();
            await page.waitForTimeout(100);
          }
        }

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/11-mobile-drawer-interaction.png`,
        });
      }
    }
  });

  test('4. Header Navigation Hover States', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Test logo hover
    const logo = page.locator('a[href="/"], [class*="logo"]').first();
    if (await logo.isVisible().catch(() => false)) {
      await logo.hover();
      await page.waitForTimeout(200);

      const logoStyles = await logo.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          transform: computed.transform,
          filter: computed.filter,
        };
      });
      console.log('Logo Hover Styles:', JSON.stringify(logoStyles, null, 2));

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/12-logo-hover.png`,
      });
    }

    // Test Sign In button - before and after
    const signIn = page.locator('a:has-text("Sign In")').first();
    if (await signIn.isVisible().catch(() => false)) {
      const beforeStyles = await signIn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
          boxShadow: computed.boxShadow,
        };
      });

      await signIn.hover();
      await page.waitForTimeout(200);

      const afterStyles = await signIn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
          boxShadow: computed.boxShadow,
        };
      });

      console.log('Sign In Button:');
      console.log('  Before:', JSON.stringify(beforeStyles));
      console.log('  After:', JSON.stringify(afterStyles));

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/13-signin-hover-detail.png`,
      });
    }

    // Test Try It button - before and after
    const tryIt = page.locator('a:has-text("Try It")').first();
    if (await tryIt.isVisible().catch(() => false)) {
      const beforeStyles = await tryIt.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
          boxShadow: computed.boxShadow,
          transform: computed.transform,
        };
      });

      await tryIt.hover();
      await page.waitForTimeout(200);

      const afterStyles = await tryIt.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor,
          color: computed.color,
          boxShadow: computed.boxShadow,
          transform: computed.transform,
        };
      });

      console.log('Try It Button:');
      console.log('  Before:', JSON.stringify(beforeStyles));
      console.log('  After:', JSON.stringify(afterStyles));

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/14-tryit-hover-detail.png`,
      });
    }

    // Test theme toggle
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="Theme"], [class*="theme"]').first();
    if (await themeToggle.isVisible().catch(() => false)) {
      await themeToggle.hover();
      await page.waitForTimeout(200);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/15-theme-toggle-hover.png`,
      });

      // Click to see animation
      await themeToggle.click();
      await page.waitForTimeout(300);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/16-theme-toggled.png`,
      });
    }
  });

  test('5. Sector List Hover States', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Find sector items
    const sectors = ['Climate Tech', 'Energy', 'Biotech', 'Waste', 'Materials Science', 'Food Tech'];

    for (let i = 0; i < sectors.length; i++) {
      const sectorEl = page.locator(`text="${sectors[i]}"`).first();
      if (await sectorEl.isVisible().catch(() => false)) {
        // Get parent container for full hover effect
        const parent = sectorEl.locator('xpath=..');

        const beforeStyles = await parent.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transform: computed.transform,
            color: computed.color,
          };
        });

        await parent.hover();
        await page.waitForTimeout(200);

        const afterStyles = await parent.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            transform: computed.transform,
            color: computed.color,
          };
        });

        console.log(`Sector "${sectors[i]}":`);
        console.log('  Before:', JSON.stringify(beforeStyles));
        console.log('  After:', JSON.stringify(afterStyles));

        if (i === 0) {
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/17-sector-hover-first.png`,
          });
        }
      }
    }

    // Screenshot with last sector hovered
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/18-sector-hover-last.png`,
    });
  });
});
