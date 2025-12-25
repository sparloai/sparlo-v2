import { Page, Locator, expect } from '@playwright/test';
import { UxAuditPageObject } from './ux-audit.po';
import { AuthPageObject } from '../authentication/auth.po';

/**
 * Page Object for navigation and sidebar UX audit
 */
export class NavigationPageObject extends UxAuditPageObject {
  private readonly auth: AuthPageObject;

  // Header elements
  readonly header: Locator;
  readonly hamburgerTrigger: Locator;
  readonly headerLogo: Locator;
  readonly headerUsageIndicator: Locator;

  // Sidebar elements
  readonly sidebar: Locator;
  readonly sidebarLogo: Locator;
  readonly newAnalysisLink: Locator;
  readonly allReportsLink: Locator;
  readonly recentReportsSection: Locator;
  readonly recentReportLinks: Locator;
  readonly usageMeterBar: Locator;
  readonly userDropdown: Locator;

  // User menu items
  readonly settingsLink: Locator;
  readonly billingLink: Locator;
  readonly themeToggle: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthPageObject(page);

    // Header elements
    this.header = page.locator('header').first();
    this.hamburgerTrigger = page.locator('button[aria-label*="menu"], button').filter({ has: page.locator('[class*="lucide-menu"]') }).first();
    this.headerLogo = page.locator('header img, header svg').first();
    this.headerUsageIndicator = page.locator('header').locator('text=/\\d+%/').first();

    // Sidebar container
    this.sidebar = page.locator('[role="dialog"], [class*="sheet"]');

    // Sidebar navigation elements
    this.sidebarLogo = this.sidebar.locator('img, svg').first();
    this.newAnalysisLink = page.getByRole('link', { name: /new analysis/i });
    this.allReportsLink = page.getByRole('link', { name: /all reports/i });

    // Recent reports
    this.recentReportsSection = this.sidebar.locator('text=RECENT').locator('..');
    this.recentReportLinks = this.sidebar.locator('a[href*="/reports/"]');

    // Usage meter
    this.usageMeterBar = this.sidebar.locator('[class*="bg-"][class*="h-2"], [role="progressbar"]');

    // User dropdown
    this.userDropdown = page.locator('[data-test="account-dropdown-trigger"]');

    // User menu items (visible after dropdown click)
    this.settingsLink = page.getByRole('link', { name: /settings/i });
    this.billingLink = page.getByRole('link', { name: /billing/i });
    this.themeToggle = page.locator('button').filter({ hasText: /theme|dark|light/i });
    this.signOutButton = page.locator('[data-test="account-dropdown-sign-out"]');
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
   * Open the sidebar/navigation drawer
   */
  async openSidebar() {
    await this.hamburgerTrigger.click();
    await this.page.waitForTimeout(300); // Allow animation
    await expect(this.sidebar).toBeVisible();
  }

  /**
   * Close the sidebar
   */
  async closeSidebar() {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify header is properly styled
   */
  async verifyHeader() {
    await expect(this.header).toBeVisible();

    // Check it's fixed/sticky
    const position = await this.header.evaluate((el) =>
      window.getComputedStyle(el).position
    );
    expect(['fixed', 'sticky']).toContain(position);

    // Check height
    const height = await this.header.evaluate((el) =>
      el.getBoundingClientRect().height
    );
    expect(height).toBeGreaterThan(40);

    // Check z-index is high enough
    const zIndex = await this.header.evaluate((el) =>
      parseInt(window.getComputedStyle(el).zIndex) || 0
    );
    expect(zIndex).toBeGreaterThan(10);
  }

  /**
   * Verify sidebar navigation items
   */
  async verifySidebarNavigation() {
    await this.openSidebar();

    // Logo should be visible
    await expect(this.sidebarLogo).toBeVisible();

    // Primary nav links should be visible
    await expect(this.newAnalysisLink).toBeVisible();
    await expect(this.allReportsLink).toBeVisible();

    // Check links have correct hrefs
    const newAnalysisHref = await this.newAnalysisLink.getAttribute('href');
    expect(newAnalysisHref).toContain('/new');

    const allReportsHref = await this.allReportsLink.getAttribute('href');
    expect(allReportsHref).toMatch(/\/home|\/reports/);
  }

  /**
   * Verify recent reports section
   */
  async verifyRecentReports() {
    await this.openSidebar();

    // Recent section may or may not have items
    const recentCount = await this.recentReportLinks.count();

    if (recentCount > 0) {
      // Verify links are clickable
      const firstReport = this.recentReportLinks.first();
      const href = await firstReport.getAttribute('href');
      expect(href).toContain('/reports/');
    }
  }

  /**
   * Verify usage meter displays correctly
   */
  async verifyUsageMeter() {
    await this.openSidebar();

    // Usage meter bar should be visible
    const meterVisible = await this.usageMeterBar.isVisible().catch(() => false);

    if (meterVisible) {
      // Check bar has proper width
      const width = await this.usageMeterBar.evaluate((el) =>
        el.getBoundingClientRect().width
      );
      expect(width).toBeGreaterThan(0);
    }
  }

  /**
   * Verify user dropdown functionality
   */
  async verifyUserDropdown() {
    await this.openSidebar();

    // Find and click user dropdown trigger
    const dropdownTrigger = this.sidebar.locator('[data-test="account-dropdown-trigger"], button').filter({ hasText: /@/ }).first();

    if (await dropdownTrigger.isVisible()) {
      await dropdownTrigger.click();
      await this.page.waitForTimeout(200);

      // Menu items should appear
      const menuItems = this.page.locator('[role="menuitem"], [role="menu"] a, [role="menu"] button');
      const itemCount = await menuItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  }

  /**
   * Verify sidebar closes properly
   */
  async verifySidebarCloses() {
    await this.openSidebar();
    await expect(this.sidebar).toBeVisible();

    await this.closeSidebar();
    await expect(this.sidebar).not.toBeVisible({ timeout: 5000 });
  }

  /**
   * Verify backdrop/overlay when sidebar is open
   */
  async verifyBackdrop() {
    await this.openSidebar();

    const backdrop = this.page.locator('[class*="overlay"], [class*="backdrop"], [data-state="open"]').first();
    const hasBackdrop = await backdrop.isVisible().catch(() => false);

    // Sidebar implementations often have a backdrop
    if (hasBackdrop) {
      // Clicking backdrop should close sidebar
      await backdrop.click({ position: { x: 10, y: 10 } });
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Test navigation links work
   */
  async testNavigationLinks() {
    await this.openSidebar();

    // Click New Analysis
    await this.newAnalysisLink.click();
    await this.page.waitForURL('**/new**', { timeout: 10000 });

    // Navigate back
    await this.page.goBack();
    await this.page.waitForLoadState('domcontentloaded');
  }
}
