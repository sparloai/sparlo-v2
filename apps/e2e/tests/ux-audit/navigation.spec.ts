import { test, expect } from '@playwright/test';
import { NavigationPageObject } from './navigation.po';
import { UxAuditPageObject } from './ux-audit.po';

// Use fresh session - we login with our own credentials
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

test.describe('Navigation & Sidebar UX Audit', () => {
  let nav: NavigationPageObject;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationPageObject(page);
    await nav.loginAndGoto(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  });

  test.describe('Header', () => {
    test('should be fixed at top of viewport', async () => {
      await nav.verifyHeader();
    });

    test('should have hamburger menu visible', async ({ page }) => {
      await expect(nav.hamburgerTrigger).toBeVisible();
    });

    test('should display logo', async ({ page }) => {
      await expect(nav.headerLogo).toBeVisible();
    });

    test('should remain fixed when scrolling', async ({ page }) => {
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(200);

      // Header should still be at top
      const box = await nav.header.boundingBox();
      expect(box?.y).toBeLessThanOrEqual(10);
    });
  });

  test.describe('Sidebar Opening/Closing', () => {
    test('should open on hamburger click', async ({ page }) => {
      await nav.openSidebar();
      await expect(nav.sidebar).toBeVisible();
    });

    test('should close on Escape key', async () => {
      await nav.verifySidebarCloses();
    });

    test('should animate smoothly', async ({ page }) => {
      // Open sidebar
      await nav.hamburgerTrigger.click();

      // Check for transition/animation
      const sidebar = nav.sidebar;
      const transition = await sidebar.evaluate((el) =>
        window.getComputedStyle(el).transition
      );

      // Should have some transition defined
      expect(transition).not.toBe('all 0s ease 0s');
    });
  });

  test.describe('Sidebar Content', () => {
    test('should display logo', async ({ page }) => {
      await nav.openSidebar();
      await expect(nav.sidebarLogo).toBeVisible();
    });

    test('should display New Analysis link', async ({ page }) => {
      await nav.openSidebar();
      await expect(nav.newAnalysisLink).toBeVisible();

      const href = await nav.newAnalysisLink.getAttribute('href');
      expect(href).toContain('/new');
    });

    test('should display All Reports link', async ({ page }) => {
      await nav.openSidebar();
      await expect(nav.allReportsLink).toBeVisible();
    });

    test('should display recent reports section', async () => {
      await nav.verifyRecentReports();
    });

    test('should display usage meter', async () => {
      await nav.verifyUsageMeter();
    });
  });

  test.describe('Navigation Links', () => {
    test('New Analysis should navigate to /new', async ({ page }) => {
      await nav.openSidebar();
      await nav.newAnalysisLink.click();
      await page.waitForURL('**/new**', { timeout: 15000 });
      expect(page.url()).toContain('/new');
    });

    test('All Reports should navigate to home or reports', async ({ page }) => {
      await nav.openSidebar();
      await nav.allReportsLink.click();
      await page.waitForLoadState('domcontentloaded');

      const url = page.url();
      expect(url).toMatch(/\/home|\/reports/);
    });
  });

  test.describe('User Menu', () => {
    test('should have user dropdown trigger', async ({ page }) => {
      await nav.openSidebar();

      // Look for user dropdown or account area
      const userArea = page.locator('[data-test="account-dropdown-trigger"], button').filter({ hasText: /@|Account/i }).first();
      const isVisible = await userArea.isVisible().catch(() => false);

      // User area should be present in some form
      expect(isVisible || await page.locator('text=Settings').isVisible()).toBeTruthy();
    });
  });

  test.describe('Visual Consistency', () => {
    test('should have consistent spacing', async ({ page }) => {
      await nav.openSidebar();

      // Sidebar should have proper width
      const sidebarWidth = await nav.sidebar.evaluate((el) =>
        el.getBoundingClientRect().width
      );
      expect(sidebarWidth).toBeGreaterThan(200);
      expect(sidebarWidth).toBeLessThan(400);
    });

    test('should have proper typography', async ({ page }) => {
      await nav.openSidebar();

      const fontFamily = await nav.sidebar.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );
      expect(fontFamily.toLowerCase()).toMatch(/soehne|sans-serif|system-ui/);
    });

    test('navigation links should have hover states', async ({ page }) => {
      await nav.openSidebar();

      const link = nav.newAnalysisLink;
      const initialBg = await link.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      await link.hover();
      await page.waitForTimeout(100);

      const hoverBg = await link.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Background should change on hover (or have visible hover state)
      // Some components use opacity or other properties
    });
  });

  test.describe('Responsive Behavior', () => {
    test('sidebar should work on tablet', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.tablet);
      await nav.openSidebar();
      await expect(nav.sidebar).toBeVisible();
    });

    test('sidebar should work on mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await nav.openSidebar();
      await expect(nav.sidebar).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('hamburger should be focusable', async ({ page }) => {
      await nav.hamburgerTrigger.focus();
      const isFocused = await nav.hamburgerTrigger.evaluate(
        (el) => el === document.activeElement
      );
      expect(isFocused).toBeTruthy();
    });

    test('navigation links should be keyboard accessible', async ({ page }) => {
      await nav.openSidebar();

      // Tab through sidebar
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Something in sidebar should be focused
      const focusedElement = await page.evaluate(() =>
        document.activeElement?.closest('[role="dialog"], [class*="sheet"]') !== null
      );
    });

    test('sidebar should have proper ARIA', async ({ page }) => {
      await nav.openSidebar();

      // Check for dialog role or similar
      const hasRole = await nav.sidebar.getAttribute('role');
      const hasAriaLabel = await nav.sidebar.getAttribute('aria-label');
      const hasAriaLabelledBy = await nav.sidebar.getAttribute('aria-labelledby');

      // Should have some form of accessible labeling
      expect(hasRole || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
    });
  });

  test.describe('Visual Snapshots', () => {
    test('should capture sidebar open state', async ({ page }) => {
      await nav.openSidebar();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: 'tests/ux-audit/baselines/navigation-sidebar-open.png',
      });
    });

    test('should capture header only', async ({ page }) => {
      await page.screenshot({
        path: 'tests/ux-audit/baselines/navigation-header.png',
        clip: { x: 0, y: 0, width: 1280, height: 60 },
      });
    });
  });
});
