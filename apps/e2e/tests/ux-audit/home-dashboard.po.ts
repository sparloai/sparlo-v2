import { Page, Locator, expect } from '@playwright/test';
import { UxAuditPageObject } from './ux-audit.po';
import { AuthPageObject } from '../authentication/auth.po';

/**
 * Page Object for home dashboard UX audit
 */
export class HomeDashboardPageObject extends UxAuditPageObject {
  private readonly auth: AuthPageObject;

  // Header elements
  readonly header: Locator;
  readonly hamburgerMenu: Locator;
  readonly logo: Locator;
  readonly usageIndicator: Locator;

  // Dashboard content
  readonly reportsHeader: Locator;
  readonly newAnalysisButton: Locator;
  readonly searchInput: Locator;
  readonly reportsList: Locator;
  readonly reportCards: Locator;

  // Empty state
  readonly emptyState: Locator;

  // Report card elements (for individual card inspection)
  readonly processingReports: Locator;
  readonly completedReports: Locator;
  readonly failedReports: Locator;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthPageObject(page);

    // Header elements
    this.header = page.locator('header').first();
    this.hamburgerMenu = page.locator('button').filter({ has: page.locator('[class*="lucide-menu"]') }).first();
    this.logo = page.locator('header').getByRole('link').first();
    this.usageIndicator = page.locator('text=/\\d+%/').first();

    // Dashboard content
    this.reportsHeader = page.locator('[data-test="reports-heading"]');
    this.newAnalysisButton = page.locator('[data-test="new-analysis-link"]');
    this.searchInput = page.locator('[data-test="search-reports-input"]');
    this.reportsList = page.locator('[data-test="reports-list"]');
    this.reportCards = page.locator('[data-test^="report-card-"]');

    // Empty state
    this.emptyState = page.locator('[data-test="reports-empty-state"]');

    // Report status indicators
    this.processingReports = page.locator('[class*="animate-pulse"]').locator('..');
    this.completedReports = page.locator('[class*="bg-green"]').locator('..');
    this.failedReports = page.locator('text=/failed|error/i').locator('..');
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
   * Verify main dashboard layout is displayed
   */
  async verifyDashboardLayout() {
    // Header is visible
    await expect(this.header).toBeVisible();

    // Reports section is visible
    await expect(this.reportsHeader).toBeVisible();

    // New Analysis button is visible
    await expect(this.newAnalysisButton).toBeVisible();
  }

  /**
   * Verify header functionality
   */
  async verifyHeaderFunctionality() {
    // Header is fixed
    const position = await this.header.evaluate((el) =>
      window.getComputedStyle(el).position
    );
    expect(['fixed', 'sticky']).toContain(position);

    // Logo is clickable
    await expect(this.logo).toBeVisible();

    // Hamburger menu is visible
    await expect(this.hamburgerMenu).toBeVisible();
  }

  /**
   * Verify sidebar can be opened
   */
  async verifySidebarOpens() {
    await this.hamburgerMenu.click();
    await this.page.waitForTimeout(300); // Allow animation

    // Sidebar content should be visible
    const sidebarContent = this.page.locator('[role="dialog"], [class*="sheet"]');
    await expect(sidebarContent).toBeVisible();

    // Close sidebar
    await this.page.keyboard.press('Escape');
  }

  /**
   * Verify new analysis button styling and link
   */
  async verifyNewAnalysisButton() {
    await expect(this.newAnalysisButton).toBeVisible();

    // Check link destination
    const href = await this.newAnalysisButton.getAttribute('href');
    expect(href).toContain('/new');

    // Verify button styling
    await this.verifyButtonStyling(this.newAnalysisButton);
  }

  /**
   * Verify search functionality exists
   */
  async verifySearchFunctionality() {
    await expect(this.searchInput).toBeVisible();

    // Should be focusable
    await this.searchInput.focus();
    const isFocused = await this.searchInput.evaluate((el) => el === document.activeElement);
    expect(isFocused).toBeTruthy();
  }

  /**
   * Verify report cards display correctly
   */
  async verifyReportCards() {
    const cardCount = await this.reportCards.count();

    if (cardCount > 0) {
      // Verify first card has expected elements
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
   * Verify usage indicator displays (on desktop)
   */
  async verifyUsageIndicator() {
    await this.page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);

    // Usage indicator may or may not be visible based on usage level
    const isVisible = await this.usageIndicator.isVisible().catch(() => false);

    // If visible, verify it shows a percentage
    if (isVisible) {
      const text = await this.usageIndicator.textContent();
      expect(text).toMatch(/\d+%/);
    }
  }

  /**
   * Test responsive layout
   */
  async testResponsiveLayout() {
    // Desktop
    await this.testAtViewport('desktop', async () => {
      await this.verifyDashboardLayout();
    });

    // Tablet
    await this.testAtViewport('tablet', async () => {
      await this.verifyDashboardLayout();
    });

    // Mobile
    await this.testAtViewport('mobile', async () => {
      await expect(this.header).toBeVisible();
      await expect(this.newAnalysisButton).toBeVisible();
    });
  }

  /**
   * Capture dashboard screenshot
   */
  async captureDashboardScreenshot(name: string = 'home-dashboard') {
    await this.captureScreenshot(name, { fullPage: true });
  }
}
