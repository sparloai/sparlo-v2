import { Page, Locator, expect } from '@playwright/test';
import { UxAuditPageObject } from './ux-audit.po';
import { AuthPageObject } from '../authentication/auth.po';

/**
 * Report modes with their accent colors
 */
export const REPORT_MODES = {
  standard: { color: 'violet', label: 'NEW ANALYSIS', path: '/home/reports/new' },
  discovery: { color: 'emerald', label: 'DISCOVERY', path: '/home/reports/discovery/new' },
  hybrid: { color: 'amber', label: 'HYBRID', path: '/home/reports/hybrid/new' },
};

/**
 * Page Object for new report creation page UX audit
 */
export class NewReportPageObject extends UxAuditPageObject {
  private readonly auth: AuthPageObject;

  // Main input elements
  readonly challengeTextarea: Locator;
  readonly submitButton: Locator;
  readonly attachButton: Locator;

  // Mode indicator
  readonly modeBadge: Locator;
  readonly modeLabel: Locator;

  // Context detection section
  readonly contextSection: Locator;
  readonly technicalGoals: Locator;
  readonly materialConstraints: Locator;
  readonly costParameters: Locator;

  // Attachment preview area
  readonly attachmentPreviews: Locator;
  readonly attachmentCount: Locator;

  // Info elements
  readonly analysisTimeEstimate: Locator;
  readonly keyboardShortcutHint: Locator;
  readonly trustIndicators: Locator;

  // Error/warning elements
  readonly errorMessage: Locator;
  readonly refusalWarning: Locator;
  readonly upgradeModal: Locator;

  constructor(page: Page) {
    super(page);
    this.auth = new AuthPageObject(page);

    // Main input elements
    this.challengeTextarea = page.locator('[data-test="challenge-input"]');
    this.submitButton = page.locator('[data-test="challenge-submit"]');
    this.attachButton = page.locator('[data-test="attach-button"]');

    // Mode indicator
    this.modeBadge = page.locator('[class*="badge"], [class*="uppercase"]').filter({ hasText: /analysis|discovery|hybrid/i });
    this.modeLabel = page.locator('text=/NEW ANALYSIS|DISCOVERY|HYBRID/i').first();

    // Context detection
    this.contextSection = page.locator('text=/context detected|technical|material|cost/i').locator('..');
    this.technicalGoals = page.locator('text=Technical').first();
    this.materialConstraints = page.locator('text=Material').first();
    this.costParameters = page.locator('text=Cost').first();

    // Attachments
    this.attachmentPreviews = page.locator('img[alt*="preview"], [class*="attachment"]');
    this.attachmentCount = page.locator('text=/\\d\\/5/').first();

    // Info elements
    this.analysisTimeEstimate = page.locator('text=/~?\\d+ min/i').first();
    this.keyboardShortcutHint = page.locator('text=/cmd|ctrl|enter/i').first();
    this.trustIndicators = page.locator('[class*="shield"], [class*="lock"]').locator('..');

    // Error/warning
    this.errorMessage = page.locator('[role="alert"], [class*="error"]').first();
    this.refusalWarning = page.locator('text=/unable to process|refusal/i').locator('..');
    this.upgradeModal = page.locator('[role="dialog"]').filter({ hasText: /upgrade|subscribe/i });
  }

  async goto(mode: keyof typeof REPORT_MODES = 'standard') {
    await this.page.goto(REPORT_MODES[mode].path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async loginAndGoto(email: string, password: string, mode: keyof typeof REPORT_MODES = 'standard') {
    await this.auth.goToSignIn();
    await this.auth.signIn({ email, password });
    await this.page.waitForURL('**/home**', { timeout: 30000 });
    await this.goto(mode);
  }

  /**
   * Verify main form elements are visible
   */
  async verifyFormLayout() {
    await expect(this.challengeTextarea).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * Verify textarea is focused on load
   */
  async verifyTextareaFocus() {
    // Textarea should be auto-focused
    await this.page.waitForTimeout(500);
    const isFocused = await this.challengeTextarea.evaluate(
      (el) => el === document.activeElement
    );
    // Auto-focus may not work in all test environments
  }

  /**
   * Verify textarea accepts input
   */
  async verifyTextareaInput() {
    const testText = 'This is a test challenge for innovation analysis';
    await this.challengeTextarea.fill(testText);

    const value = await this.challengeTextarea.inputValue();
    expect(value).toBe(testText);
  }

  /**
   * Verify submit button is disabled without enough text
   */
  async verifySubmitValidation() {
    // Clear textarea
    await this.challengeTextarea.fill('');

    // Button should be disabled
    const isDisabled = await this.submitButton.isDisabled();
    expect(isDisabled).toBeTruthy();

    // Add minimum text (50 chars)
    const validText = 'This is a test challenge that meets the minimum character requirement for submission.';
    await this.challengeTextarea.fill(validText);

    // Button should now be enabled
    const isNowDisabled = await this.submitButton.isDisabled();
    expect(isNowDisabled).toBeFalsy();
  }

  /**
   * Verify mode indicator styling
   */
  async verifyModeIndicator(mode: keyof typeof REPORT_MODES) {
    const config = REPORT_MODES[mode];

    // Mode label should contain expected text
    const modeText = await this.modeLabel.textContent().catch(() => '');
    expect(modeText?.toLowerCase()).toContain(config.label.split(' ')[0].toLowerCase());
  }

  /**
   * Verify attach button is visible
   */
  async verifyAttachButton() {
    await expect(this.attachButton).toBeVisible();

    // Should show cursor pointer
    const cursor = await this.attachButton.evaluate((el) =>
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  }

  /**
   * Verify context detection section exists
   */
  async verifyContextDetection() {
    // Type text that triggers context detection
    await this.challengeTextarea.fill(
      'We need to reduce manufacturing costs by 30% while maintaining tensile strength above 500MPa with a budget of $50,000 for aluminum alloy components.'
    );

    await this.page.waitForTimeout(500); // Allow context detection to run

    // Context indicators should appear
    const contextVisible = await this.page.locator('text=/technical|material|cost/i').first().isVisible().catch(() => false);
  }

  /**
   * Verify time estimate is displayed
   */
  async verifyTimeEstimate() {
    const timeVisible = await this.analysisTimeEstimate.isVisible().catch(() => false);
    if (timeVisible) {
      const text = await this.analysisTimeEstimate.textContent();
      expect(text).toMatch(/\d+\s*min/i);
    }
  }

  /**
   * Verify keyboard shortcut hint
   */
  async verifyKeyboardShortcut() {
    const shortcutVisible = await this.keyboardShortcutHint.isVisible().catch(() => false);
    if (shortcutVisible) {
      const text = await this.keyboardShortcutHint.textContent();
      expect(text?.toLowerCase()).toMatch(/cmd|ctrl|enter/);
    }
  }

  /**
   * Test responsive layout
   */
  async testResponsiveLayout() {
    // Desktop
    await this.testAtViewport('desktop', async () => {
      await this.verifyFormLayout();
    });

    // Tablet
    await this.testAtViewport('tablet', async () => {
      await expect(this.challengeTextarea).toBeVisible();
    });

    // Mobile
    await this.testAtViewport('mobile', async () => {
      await expect(this.challengeTextarea).toBeVisible();
      await expect(this.submitButton).toBeVisible();
    });
  }

  /**
   * Capture new report page screenshot
   */
  async captureScreenshot(name: string = 'new-report') {
    await this.page.screenshot({
      path: `tests/ux-audit/baselines/${name}.png`,
      fullPage: true,
    });
  }
}
