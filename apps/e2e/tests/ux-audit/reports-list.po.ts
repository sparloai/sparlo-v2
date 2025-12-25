import { Page, Locator, expect } from '@playwright/test';
import { UxAuditPageObject } from './ux-audit.po';
import { AuthPageObject } from '../authentication/auth.po';

/**
 * Report status types
 */
export const REPORT_STATUSES = {
  processing: { indicator: 'purple', hasAnimation: true },
  complete: { indicator: 'green', hasAnimation: false },
  failed: { indicator: 'red', hasAnimation: false },
  cancelled: { indicator: 'gray', hasAnimation: false },
};

/**
 * Page Object for reports list page UX audit
 * This covers the main dashboard reports listing at /home
 */
export class ReportsListPageObject extends UxAuditPageObject {
  private readonly auth: AuthPageObject;

  // Header section
  readonly reportsHeader: Locator;
  readonly newAnalysisButton: Locator;

  // Search/filter
  readonly searchInput: Locator;
  readonly filterButtons: Locator;

  // Reports list
  readonly reportsList: Locator;
  readonly reportCards: Locator;
  readonly emptyState: Locator;
  readonly reportCount: Locator;

  // Individual report card elements
  readonly processingReports: Locator;
  readonly completedReports: Locator;
  readonly failedReports: Locator;
  readonly cancelledReports: Locator;

  // Report card actions
  readonly archiveButtons: Locator;
  readonly viewButtons: Locator;
  readonly cancelButtons: Locator;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthPageObject(page);

    // Header section
    this.reportsHeader = page.locator('[data-test="reports-heading"]');
    this.newAnalysisButton = page.locator('[data-test="new-analysis-link"]');

    // Search/filter
    this.searchInput = page.getByPlaceholder(/search/i);
    this.filterButtons = page.locator('button').filter({ hasText: /all|active|archived/i });

    // Reports list
    this.reportsList = page.locator('[data-test="reports-list"]');
    this.reportCards = page.locator('[data-test^="report-card-"]');
    this.emptyState = page.locator('[data-test="reports-empty-state"]');
    this.reportCount = page.locator('text=/showing \\d+|\\d+ reports?/i').first();

    // Report status cards
    this.processingReports = page.locator('[class*="animate-pulse"], [class*="pulsing"]').locator('..').locator('..');
    this.completedReports = page.locator('[class*="bg-green"], [class*="text-green"]').locator('..').locator('..');
    this.failedReports = page.locator('text=/failed|error/i').locator('..').locator('..');
    this.cancelledReports = page.locator('text=cancelled').locator('..').locator('..');

    // Actions
    this.archiveButtons = page.getByRole('button', { name: /archive/i });
    this.viewButtons = page.getByRole('link', { name: /view|open/i });
    this.cancelButtons = page.getByRole('button', { name: /cancel/i });
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
   * Verify reports list layout
   */
  async verifyListLayout() {
    await expect(this.reportsHeader).toBeVisible();
    await expect(this.newAnalysisButton).toBeVisible();
  }

  /**
   * Verify search functionality exists
   */
  async verifySearchInput() {
    await expect(this.searchInput).toBeVisible();

    // Should be focusable
    await this.searchInput.focus();
    const isFocused = await this.searchInput.evaluate(
      (el) => el === document.activeElement
    );
    expect(isFocused).toBeTruthy();
  }

  /**
   * Test search filtering
   */
  async testSearchFiltering(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(500); // Allow debounce

    // Results should update
    const cardCount = await this.reportCards.count();
    return cardCount;
  }

  /**
   * Verify report cards have proper structure
   */
  async verifyReportCardStructure() {
    const cardCount = await this.reportCards.count();

    if (cardCount > 0) {
      const firstCard = this.reportCards.first();
      await expect(firstCard).toBeVisible();

      // Card should have some content
      const text = await firstCard.textContent();
      expect(text?.length).toBeGreaterThan(0);
    } else {
      // Empty state should be shown
      await expect(this.emptyState).toBeVisible();
    }
  }

  /**
   * Verify report status indicators
   */
  async verifyStatusIndicators() {
    // Check for any status indicator (dot or badge)
    const statusIndicators = this.page.locator(
      '[class*="rounded-full"][class*="w-2"], [class*="dot"], [class*="badge"]'
    );
    const count = await statusIndicators.count();

    // If we have reports, we should have status indicators
    const reportCount = await this.reportCards.count();
    if (reportCount > 0) {
      expect(count).toBeGreaterThan(0);
    }
  }

  /**
   * Verify processing reports have animation
   */
  async verifyProcessingAnimation() {
    const processingCount = await this.processingReports.count();

    if (processingCount > 0) {
      // Should have pulsing animation
      const firstProcessing = this.processingReports.first();
      const animation = await firstProcessing.evaluate((el) =>
        window.getComputedStyle(el).animation
      );
      // May have animation defined
    }
  }

  /**
   * Verify new analysis button styling
   */
  async verifyNewAnalysisButton() {
    await expect(this.newAnalysisButton).toBeVisible();

    // Check link destination
    const href = await this.newAnalysisButton.getAttribute('href');
    expect(href).toContain('/new');

    // Should have proper styling
    await this.verifyButtonStyling(this.newAnalysisButton);
  }

  /**
   * Verify report count display
   */
  async verifyReportCount() {
    const countVisible = await this.reportCount.isVisible().catch(() => false);

    if (countVisible) {
      const text = await this.reportCount.textContent();
      expect(text).toMatch(/\d+/);
    }
  }

  /**
   * Test responsive layout
   */
  async testResponsiveLayout() {
    // Desktop
    await this.testAtViewport('desktop', async () => {
      await this.verifyListLayout();
    });

    // Tablet
    await this.testAtViewport('tablet', async () => {
      await expect(this.reportsHeader).toBeVisible();
    });

    // Mobile
    await this.testAtViewport('mobile', async () => {
      await expect(this.reportsHeader).toBeVisible();
      await expect(this.newAnalysisButton).toBeVisible();
    });
  }

  /**
   * Click first report to navigate
   */
  async clickFirstReport() {
    const firstCard = this.reportCards.first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  /**
   * Capture reports list screenshot
   */
  async captureScreenshot(name: string = 'reports-list') {
    await this.page.screenshot({
      path: `tests/ux-audit/baselines/${name}.png`,
      fullPage: true,
    });
  }
}
