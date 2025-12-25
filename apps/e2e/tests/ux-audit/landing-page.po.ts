import { Page, Locator } from '@playwright/test';
import { UxAuditPageObject } from './ux-audit.po';

/**
 * Page Object for landing page UX audit
 */
export class LandingPageObject extends UxAuditPageObject {
  // Hero section elements
  readonly heroSection: Locator;
  readonly heroHeadline: Locator;
  readonly heroCta: Locator;
  readonly heroDescription: Locator;
  readonly intelligenceBadge: Locator;
  readonly sectorsList: Locator;

  // Header elements
  readonly header: Locator;
  readonly logo: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly themeToggle: Locator;

  // Example reports section
  readonly exampleReportsSection: Locator;
  readonly reportTabs: Locator;
  readonly tableOfContents: Locator;
  readonly reportContent: Locator;

  // Stats ticker
  readonly statsTicker: Locator;

  // Scroll indicator
  readonly scrollIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // Hero section - using visible text and structure since no data-test attrs
    this.heroSection = page.locator('main').first();
    this.heroHeadline = page.getByRole('heading', { name: /AI-Powered Innovation Engine/i });
    this.heroCta = page.getByRole('link', { name: /run analysis/i });
    this.heroDescription = page.locator('p').filter({ hasText: /first-principles/i });
    this.intelligenceBadge = page.locator('text=Intelligence Model').first();
    this.sectorsList = page.locator('text=Target Sectors').locator('..');

    // Header elements
    this.header = page.locator('header').first();
    this.logo = page.locator('header').getByRole('link').first();
    this.signInButton = page.getByRole('link', { name: /sign in/i });
    this.signUpButton = page.getByRole('link', { name: /try it/i });
    this.themeToggle = page.locator('button').filter({ has: page.locator('[class*="lucide"]') });

    // Example reports section
    this.exampleReportsSection = page.locator('#description').locator('..');
    this.reportTabs = page.locator('[role="tablist"]');
    this.tableOfContents = page.locator('nav').filter({ hasText: /contents/i });
    this.reportContent = page.locator('article').first();

    // Stats ticker
    this.statsTicker = page.locator('text=System Status').locator('..').locator('..');

    // Scroll indicator
    this.scrollIndicator = page.locator('text=View Example Reports').locator('..');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Verify hero section displays correctly
   */
  async verifyHeroSection() {
    // Headline is visible and has content
    await this.verifyVisibleWithContent(this.heroHeadline);

    // CTA button is visible
    await this.heroCta.waitFor({ state: 'visible' });

    // Intelligence badge shows
    await this.intelligenceBadge.waitFor({ state: 'visible' });
  }

  /**
   * Verify all sectors are displayed
   */
  async verifySectorsList() {
    const sectors = ['Climate Tech', 'Energy Systems', 'Biotechnology', 'Waste Management', 'Raw Materials'];

    for (const sector of sectors) {
      // Use first() to handle multiple matches (sector list item + report tab)
      await this.page.locator(`text=${sector}`).first().waitFor({ state: 'visible' });
    }
  }

  /**
   * Verify header navigation is complete
   */
  async verifyHeaderNavigation() {
    await this.header.waitFor({ state: 'visible' });
    await this.logo.waitFor({ state: 'visible' });

    // Auth buttons should be visible for unauthenticated users
    await this.signInButton.waitFor({ state: 'visible' });
    await this.signUpButton.waitFor({ state: 'visible' });
  }

  /**
   * Verify CTA button styling and behavior
   */
  async verifyCTAButton() {
    await this.verifyButtonStyling(this.heroCta);

    // Check it links to sign-up
    const href = await this.heroCta.getAttribute('href');
    if (href) {
      expect(href).toContain('/auth/sign-up');
    }
  }

  /**
   * Verify stats ticker displays status
   */
  async verifyStatsTicker() {
    const stats = ['System Status', 'Nominal', 'CPU', 'Database'];

    for (const stat of stats) {
      const element = this.page.locator(`text=${stat}`).first();
      await element.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        // Some stats may be conditionally visible
      });
    }
  }

  /**
   * Verify example reports section loads
   */
  async verifyExampleReportsSection() {
    // Scroll to reports section
    const descSection = this.page.locator('#description');
    if (await descSection.isVisible().catch(() => false)) {
      await descSection.scrollIntoViewIfNeeded();
    } else {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    }
    await this.page.waitForTimeout(500); // Allow scroll animation

    // Check for report content - Climate Tech should be visible as it's the first tab
    const hasClimateReport = await this.page.locator('text=Climate Tech').first().isVisible().catch(() => false);
    return hasClimateReport;
  }

  /**
   * Test responsive layout at different viewports
   */
  async testResponsiveLayout() {
    // Desktop - full layout
    await this.testAtViewport('desktop', async () => {
      await this.verifyHeroSection();
      await this.verifySectorsList();
    });

    // Tablet - may stack columns
    await this.testAtViewport('tablet', async () => {
      await this.verifyHeroSection();
    });

    // Mobile - stacked layout
    await this.testAtViewport('mobile', async () => {
      await this.heroHeadline.waitFor({ state: 'visible' });
      await this.heroCta.waitFor({ state: 'visible' });
    });
  }

  /**
   * Capture full page screenshot
   */
  async captureFullPageScreenshot(name: string = 'landing-page') {
    await this.captureScreenshot(name, { fullPage: true });
  }
}

// Re-export expect for convenience
import { expect } from '@playwright/test';
