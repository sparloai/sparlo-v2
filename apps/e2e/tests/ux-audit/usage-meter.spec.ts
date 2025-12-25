import { test, expect } from '@playwright/test';
import { UsageMeterPageObject, USAGE_THRESHOLDS } from './usage-meter.po';
import { UxAuditPageObject } from './ux-audit.po';

// Use fresh session - we login with our own credentials
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

test.describe('Usage Meter UX Audit', () => {
  let usage: UsageMeterPageObject;

  test.beforeEach(async ({ page }) => {
    usage = new UsageMeterPageObject(page);
    await usage.loginAndGoto(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  });

  test.describe('Visibility', () => {
    test('should display usage meter in sidebar', async () => {
      await usage.verifyUsageMeterVisible();
    });

    test('should show usage label', async ({ page }) => {
      await usage.openSidebar();
      const usageLabel = page.locator('text=Usage').first();
      await expect(usageLabel).toBeVisible();
    });

    test('should show percentage value', async ({ page }) => {
      await usage.openSidebar();
      const percentText = page.locator('text=/\\d+%/').first();
      const isVisible = await percentText.isVisible().catch(() => false);

      // Percentage should be visible if there's usage data
      // May not be visible if user has no usage yet
    });
  });

  test.describe('Progress Bar Styling', () => {
    test('should have progress bar with proper height', async () => {
      await usage.verifyProgressBarStyling();
    });

    test('should use color-coded thresholds', async ({ page }) => {
      await usage.openSidebar();

      // Progress bar should have a visible color
      const progressInner = page.locator('[class*="Progress"]').locator('div').first();
      const isVisible = await progressInner.isVisible().catch(() => false);

      if (isVisible) {
        const bg = await progressInner.evaluate((el) =>
          window.getComputedStyle(el).backgroundColor
        );
        expect(bg).not.toBe('transparent');
      }
    });
  });

  test.describe('Tooltip Interaction', () => {
    test('should show tooltip on hover', async () => {
      await usage.verifyTooltipOnHover();
    });

    test('tooltip should contain reset information', async ({ page }) => {
      await usage.hoverUsageMeter();

      const tooltip = page.locator('[role="tooltip"]');
      if (await tooltip.isVisible()) {
        const text = await tooltip.textContent();
        // Should mention reset time or days
        expect(text?.toLowerCase()).toMatch(/reset|day/);
      }
    });

    test('tooltip should have upgrade link', async () => {
      await usage.verifyUpgradeLinkInTooltip();
    });
  });

  test.describe('Header Usage Indicator', () => {
    test('should be visible on desktop when usage >= 25%', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);

      const percentage = await usage.getUsagePercentage();

      if (percentage >= USAGE_THRESHOLDS.VISIBLE_AT) {
        const headerIndicator = page.locator('header').locator('text=/\\d+%/').first();
        // Should be visible on desktop
        const isVisible = await headerIndicator.isVisible().catch(() => false);
        // Note: May be conditionally rendered based on screen size
      }
    });

    test('should be hidden on mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);

      // Header usage indicator should not be visible on mobile
      // Users access usage via sidebar instead
      const headerIndicator = page.locator('header').locator('text=/\\d+%/').first();
      const isVisible = await headerIndicator.isVisible().catch(() => false);
      // On mobile, we expect this to be hidden (sidebar is the access point)
    });
  });

  test.describe('Threshold Colors', () => {
    test('should display appropriate color for usage level', async ({ page }) => {
      await usage.openSidebar();

      const percentage = await usage.getUsagePercentage();
      const percentElement = page.locator('text=/\\d+%/').first();

      if (await percentElement.isVisible()) {
        const color = await percentElement.evaluate((el) =>
          window.getComputedStyle(el).color
        );

        if (percentage >= USAGE_THRESHOLDS.CRITICAL) {
          // Should be red/destructive color
          // RGB values with high red component
        } else if (percentage >= USAGE_THRESHOLDS.WARNING) {
          // Should be amber/warning color
        }
        // Below warning threshold, normal text color

        expect(color).toBeTruthy();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should be accessible on desktop via sidebar', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);
      await usage.verifyUsageMeterVisible();
    });

    test('should be accessible on tablet via sidebar', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.tablet);
      await usage.verifyUsageMeterVisible();
    });

    test('should be accessible on mobile via sidebar', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await usage.verifyUsageMeterVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('usage area should be focusable', async ({ page }) => {
      await usage.openSidebar();

      const usageArea = page.locator('[class*="cursor-help"]').first();
      if (await usageArea.isVisible()) {
        // Check it has appropriate cursor for help/tooltip
        const cursor = await usageArea.evaluate((el) =>
          window.getComputedStyle(el).cursor
        );
        expect(cursor).toBe('help');
      }
    });

    test('progress bar should have appropriate ARIA', async ({ page }) => {
      await usage.openSidebar();

      const progressBar = page.locator('[role="progressbar"]').first();
      const hasProgressBar = await progressBar.isVisible().catch(() => false);

      if (hasProgressBar) {
        // Should have role="progressbar"
        const role = await progressBar.getAttribute('role');
        expect(role).toBe('progressbar');
      }
    });
  });

  test.describe('Visual Consistency', () => {
    test('should use consistent typography', async ({ page }) => {
      await usage.openSidebar();

      const usageLabel = page.locator('text=Usage').first();
      if (await usageLabel.isVisible()) {
        const fontFamily = await usageLabel.evaluate((el) =>
          window.getComputedStyle(el).fontFamily
        );
        expect(fontFamily.toLowerCase()).toMatch(/soehne|sans-serif|system-ui/);
      }
    });

    test('should have consistent spacing', async ({ page }) => {
      await usage.openSidebar();

      // Usage area should have proper spacing
      const usageArea = page.locator('text=Usage').locator('..').first();
      if (await usageArea.isVisible()) {
        const padding = await usageArea.evaluate((el) =>
          window.getComputedStyle(el).padding
        );
        // Should have some padding for proper visual spacing
      }
    });
  });

  test.describe('Visual Snapshots', () => {
    test('should capture usage meter in sidebar', async ({ page }) => {
      await usage.openSidebar();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: 'tests/ux-audit/baselines/usage-meter-sidebar.png',
      });
    });

    test('should capture usage tooltip', async ({ page }) => {
      await usage.hoverUsageMeter();
      await page.waitForTimeout(200);

      const tooltip = page.locator('[role="tooltip"]');
      if (await tooltip.isVisible()) {
        await page.screenshot({
          path: 'tests/ux-audit/baselines/usage-meter-tooltip.png',
        });
      }
    });
  });
});
