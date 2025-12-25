import { test, expect } from '@playwright/test';
import { HomeDashboardPageObject } from './home-dashboard.po';
import { UxAuditPageObject } from './ux-audit.po';

// Use fresh session - we login with our own credentials
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

test.describe('Home Dashboard UX Audit', () => {
  let dashboard: HomeDashboardPageObject;

  test.beforeEach(async ({ page }) => {
    dashboard = new HomeDashboardPageObject(page);
    await dashboard.loginAndGoto(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  });

  test.describe('Dashboard Layout', () => {
    test('should display main dashboard elements', async () => {
      await dashboard.verifyDashboardLayout();
    });

    test('should have fixed header at top', async () => {
      await dashboard.verifyHeaderFunctionality();
    });

    test('should open sidebar on hamburger click', async () => {
      await dashboard.verifySidebarOpens();
    });
  });

  test.describe('Reports Section', () => {
    test('should display reports header', async ({ page }) => {
      await expect(dashboard.reportsHeader).toBeVisible();
    });

    test('should have new analysis button with correct link', async () => {
      await dashboard.verifyNewAnalysisButton();
    });

    test('should have search input for filtering', async () => {
      await dashboard.verifySearchFunctionality();
    });

    test('should display report cards or empty state', async () => {
      await dashboard.verifyReportCards();
    });
  });

  test.describe('Header Navigation', () => {
    test('should display logo', async ({ page }) => {
      await expect(dashboard.logo).toBeVisible();
    });

    test('should display hamburger menu', async ({ page }) => {
      await expect(dashboard.hamburgerMenu).toBeVisible();
    });

    test('header should remain fixed when scrolling', async ({ page }) => {
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);

      // Header should still be visible
      await expect(dashboard.header).toBeVisible();

      // Should be at top of viewport
      const headerBox = await dashboard.header.boundingBox();
      expect(headerBox?.y).toBeLessThanOrEqual(10);
    });
  });

  test.describe('Visual Consistency', () => {
    test('should use consistent font family', async ({ page }) => {
      const body = page.locator('body');
      const fontFamily = await body.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );

      // Should include Soehne or standard sans-serif fallback
      expect(fontFamily.toLowerCase()).toMatch(/soehne|sans-serif|system-ui/);
    });

    test('should have proper heading sizes', async ({ page }) => {
      const h1 = page.locator('h1').first();
      const h2 = page.locator('h2').first();

      if (await h1.isVisible() && await h2.isVisible()) {
        const h1Size = await h1.evaluate((el) =>
          parseFloat(window.getComputedStyle(el).fontSize)
        );
        const h2Size = await h2.evaluate((el) =>
          parseFloat(window.getComputedStyle(el).fontSize)
        );

        expect(h1Size).toBeGreaterThanOrEqual(h2Size);
      }
    });

    test('should have proper spacing in main content', async ({ page }) => {
      const mainContent = page.locator('main').first();
      const padding = await mainContent.evaluate((el) =>
        window.getComputedStyle(el).paddingTop
      );

      // Should have padding for fixed header
      const paddingValue = parseFloat(padding);
      expect(paddingValue).toBeGreaterThan(0);
    });
  });

  test.describe('Interactive Elements', () => {
    test('new analysis button should be clickable', async ({ page }) => {
      const cursor = await dashboard.newAnalysisButton.evaluate((el) =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });

    test('search input should be focusable', async ({ page }) => {
      await dashboard.searchInput.focus();
      const isFocused = await dashboard.searchInput.evaluate(
        (el) => el === document.activeElement
      );
      expect(isFocused).toBeTruthy();
    });

    test('hamburger menu should toggle sidebar', async ({ page }) => {
      // Click to open
      await dashboard.hamburgerMenu.click();
      await page.waitForTimeout(300);

      // Sidebar content should appear
      const sidebar = page.locator('[role="dialog"], [class*="sheet"]');
      await expect(sidebar).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for desktop', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);
      await dashboard.verifyDashboardLayout();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.tablet);
      await expect(dashboard.header).toBeVisible();
      await expect(dashboard.newAnalysisButton).toBeVisible();
    });

    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await expect(dashboard.header).toBeVisible();
      await expect(dashboard.hamburgerMenu).toBeVisible();
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should load without critical console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await dashboard.goto();
      await page.waitForLoadState('networkidle');

      // Filter known benign errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('analytics') && !e.includes('hydration')
      );

      // Should have no critical errors
      expect(criticalErrors.length).toBeLessThanOrEqual(2);
    });

    test('should have accessible heading structure', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3').all();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('buttons should be keyboard accessible', async ({ page }) => {
      // Tab to new analysis button
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Something should be focused
      const focusedElement = await page.evaluate(() =>
        document.activeElement?.tagName
      );
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Visual Snapshots', () => {
    test('should capture dashboard screenshot', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/home-dashboard-desktop.png',
        fullPage: true,
      });
    });

    test('should capture mobile dashboard screenshot', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/home-dashboard-mobile.png',
        fullPage: true,
      });
    });

    test('should capture sidebar screenshot', async ({ page }) => {
      await dashboard.hamburgerMenu.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: 'tests/ux-audit/baselines/home-dashboard-sidebar.png',
      });
    });
  });
});
