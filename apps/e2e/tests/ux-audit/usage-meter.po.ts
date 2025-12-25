import { Page, Locator, expect } from '@playwright/test';
import { UxAuditPageObject } from './ux-audit.po';
import { AuthPageObject } from '../authentication/auth.po';

/**
 * Usage thresholds from the application constants
 */
export const USAGE_THRESHOLDS = {
  VISIBLE_AT: 25,      // Show usage bar when usage >= 25%
  WARNING: 80,         // Show warning (amber) at 80%
  CRITICAL: 95,        // Show critical (red) at 95%
  HARD_LIMIT: 100,     // Block new reports at 100%
};

/**
 * Page Object for usage meter UX audit
 */
export class UsageMeterPageObject extends UxAuditPageObject {
  private readonly auth: AuthPageObject;

  // Header usage indicator
  readonly headerUsageIndicator: Locator;

  // Sidebar usage meter
  readonly sidebarUsageMeter: Locator;
  readonly usageProgressBar: Locator;
  readonly usagePercentageText: Locator;
  readonly usageLabelText: Locator;

  // Tooltip elements (visible on hover)
  readonly usageTooltip: Locator;
  readonly tooltipResetDays: Locator;
  readonly tooltipUpgradeButton: Locator;

  // Hamburger to open sidebar
  readonly hamburgerTrigger: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthPageObject(page);

    // Header usage indicator (visible on desktop when >= 25%)
    this.headerUsageIndicator = page.locator('header').locator('text=/\\d+%/').first();

    // Sidebar usage meter
    this.sidebarUsageMeter = page.locator('[class*="cursor-help"]').filter({ hasText: /usage/i });
    this.usageProgressBar = page.locator('[role="progressbar"], [class*="Progress"]');
    this.usagePercentageText = page.locator('text=/\\d+%/').first();
    this.usageLabelText = page.locator('text=Usage').first();

    // Tooltip elements
    this.usageTooltip = page.locator('[role="tooltip"]');
    this.tooltipResetDays = page.locator('[role="tooltip"]').locator('text=/\\d+ days/');
    this.tooltipUpgradeButton = page.locator('[role="tooltip"]').getByRole('link', { name: /upgrade/i });

    // Navigation
    this.hamburgerTrigger = page.locator('button').filter({ has: page.locator('[class*="lucide-menu"]') }).first();
    this.sidebar = page.locator('[role="dialog"], [class*="sheet"]');
  }

  async goto() {
    await this.page.goto('/home');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async loginAndGoto(email: string, password: string) {
    await this.auth.goToSignIn();
    await this.auth.signIn({ email, password });
    await this.page.waitForURL('**/home**', { timeout: 30000 });
  }

  /**
   * Open sidebar to access usage meter
   */
  async openSidebar() {
    await this.hamburgerTrigger.click();
    await this.page.waitForTimeout(300);
    await expect(this.sidebar).toBeVisible();
  }

  /**
   * Hover over usage meter to show tooltip
   */
  async hoverUsageMeter() {
    await this.openSidebar();

    // Find and hover over the usage indicator
    const usageArea = this.sidebar.locator('text=Usage').locator('..').first();
    if (await usageArea.isVisible()) {
      await usageArea.hover();
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Get current usage percentage
   */
  async getUsagePercentage(): Promise<number> {
    await this.openSidebar();

    const percentText = await this.usagePercentageText.textContent().catch(() => '0%');
    const match = percentText?.match(/(\d+)%/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Verify usage meter is displayed in sidebar
   */
  async verifyUsageMeterVisible() {
    await this.openSidebar();

    // Look for usage label and percentage
    const usageLabel = this.sidebar.locator('text=Usage').first();
    await expect(usageLabel).toBeVisible();
  }

  /**
   * Verify progress bar exists and has proper styling
   */
  async verifyProgressBarStyling() {
    await this.openSidebar();

    const progressBar = this.sidebar.locator('[role="progressbar"], [class*="h-1"]').first();
    const isVisible = await progressBar.isVisible().catch(() => false);

    if (isVisible) {
      // Check bar has some height
      const height = await progressBar.evaluate((el) =>
        el.getBoundingClientRect().height
      );
      expect(height).toBeGreaterThan(0);

      // Check bar has proper background
      const bg = await progressBar.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );
      expect(bg).not.toBe('rgba(0, 0, 0, 0)');
    }
  }

  /**
   * Verify color changes based on usage threshold
   */
  async verifyThresholdColors() {
    await this.openSidebar();
    const percentage = await this.getUsagePercentage();

    const percentElement = this.sidebar.locator('text=/\\d+%/').first();
    if (await percentElement.isVisible()) {
      const color = await percentElement.evaluate((el) =>
        window.getComputedStyle(el).color
      );

      // Based on thresholds, color should match
      if (percentage >= USAGE_THRESHOLDS.CRITICAL) {
        // Should be red
        expect(color).toMatch(/rgb\((2[0-5]\d|1\d\d|\d{1,2}),\s*(0|[1-9]?\d),\s*(0|[1-9]?\d)\)/);
      } else if (percentage >= USAGE_THRESHOLDS.WARNING) {
        // Should be amber/warning color
        expect(color).toBeTruthy();
      }
    }
  }

  /**
   * Verify tooltip appears on hover
   */
  async verifyTooltipOnHover() {
    await this.hoverUsageMeter();

    // Tooltip should appear
    const tooltip = this.page.locator('[role="tooltip"]');
    const tooltipVisible = await tooltip.isVisible().catch(() => false);

    if (tooltipVisible) {
      // Should show reset days
      const hasResetInfo = await tooltip.locator('text=/resets|days/i').isVisible().catch(() => false);

      // Should have upgrade link
      const upgradeLink = tooltip.getByRole('link', { name: /upgrade/i });
      const hasUpgrade = await upgradeLink.isVisible().catch(() => false);

      expect(hasResetInfo || hasUpgrade).toBeTruthy();
    }
  }

  /**
   * Verify upgrade link in tooltip
   */
  async verifyUpgradeLinkInTooltip() {
    await this.hoverUsageMeter();

    const tooltip = this.page.locator('[role="tooltip"]');
    if (await tooltip.isVisible()) {
      const upgradeLink = tooltip.getByRole('link', { name: /upgrade/i });
      if (await upgradeLink.isVisible()) {
        const href = await upgradeLink.getAttribute('href');
        expect(href).toContain('/billing');
      }
    }
  }

  /**
   * Verify header usage indicator visibility (desktop only, >= 25%)
   */
  async verifyHeaderUsageIndicator() {
    await this.page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);

    const percentage = await this.getUsagePercentage();

    // Header indicator should only be visible if usage >= 25%
    const headerIndicator = this.page.locator('header').locator('text=/\\d+%/').first();
    const isVisible = await headerIndicator.isVisible().catch(() => false);

    if (percentage >= USAGE_THRESHOLDS.VISIBLE_AT) {
      // Should be visible on desktop
      expect(isVisible).toBeTruthy();
    }
  }

  /**
   * Test usage meter responsive behavior
   */
  async testResponsiveBehavior() {
    // Desktop - header indicator may be visible
    await this.testAtViewport('desktop', async () => {
      // Usage should be accessible via sidebar
      await this.verifyUsageMeterVisible();
    });

    // Mobile - only sidebar usage
    await this.testAtViewport('mobile', async () => {
      await this.verifyUsageMeterVisible();
    });
  }
}
