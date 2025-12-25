import { Page, expect, Locator } from '@playwright/test';

/**
 * Base class for UX audit testing with shared utilities
 * for visual consistency, typography, spacing, and interactive element checks.
 */
export class UxAuditPageObject {
  constructor(protected readonly page: Page) {}

  // Design token expectations
  static readonly DESIGN_TOKENS = {
    // Soehne font family
    fontFamily: 'Soehne',
    // Primary violet accent
    accentColor: 'rgb(124, 58, 237)', // #7C3AED
    // Zinc palette for borders/backgrounds
    borderColor: 'rgb(228, 228, 231)', // zinc-200
    // Text colors
    textPrimary: 'rgb(9, 9, 11)', // zinc-950
    textSecondary: 'rgb(113, 113, 122)', // zinc-500
  };

  // Viewport configurations
  static readonly VIEWPORTS = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 },
    large: { width: 1920, height: 1080 },
  };

  // Usage meter thresholds
  static readonly USAGE_THRESHOLDS = {
    low: { max: 25, color: 'rgb(34, 197, 94)' }, // green-500
    medium: { max: 75, color: 'rgb(234, 179, 8)' }, // yellow-500
    high: { max: 90, color: 'rgb(249, 115, 22)' }, // orange-500
    critical: { max: 100, color: 'rgb(239, 68, 68)' }, // red-500
  };

  /**
   * Take a full-page screenshot with consistent naming
   */
  async captureScreenshot(name: string, options?: { fullPage?: boolean }) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `tests/ux-audit/baselines/${name}-${timestamp}.png`,
      fullPage: options?.fullPage ?? true,
    });
  }

  /**
   * Verify Soehne font is loaded and applied
   */
  async verifyTypography(element: Locator) {
    const fontFamily = await element.evaluate((el) =>
      window.getComputedStyle(el).fontFamily
    );
    // Check if Soehne is in the font stack (may have fallbacks)
    expect(fontFamily.toLowerCase()).toContain('soehne');
  }

  /**
   * Verify element has consistent spacing (padding/margin)
   */
  async verifySpacing(element: Locator, expected: {
    padding?: string;
    margin?: string;
  }) {
    if (expected.padding) {
      const padding = await element.evaluate((el) =>
        window.getComputedStyle(el).padding
      );
      expect(padding).toBe(expected.padding);
    }
    if (expected.margin) {
      const margin = await element.evaluate((el) =>
        window.getComputedStyle(el).margin
      );
      expect(margin).toBe(expected.margin);
    }
  }

  /**
   * Verify element has proper focus state (accessibility)
   */
  async verifyFocusState(element: Locator) {
    await element.focus();
    const outline = await element.evaluate((el) =>
      window.getComputedStyle(el).outline
    );
    // Should have visible focus ring
    expect(outline).not.toBe('none');
  }

  /**
   * Verify interactive element has hover state
   */
  async verifyHoverState(element: Locator, property: string = 'backgroundColor') {
    const initialValue = await element.evaluate((el, prop) =>
      window.getComputedStyle(el).getPropertyValue(prop), property
    );

    await element.hover();
    await this.page.waitForTimeout(100); // Allow transition

    const hoverValue = await element.evaluate((el, prop) =>
      window.getComputedStyle(el).getPropertyValue(prop), property
    );

    // Hover should change something
    expect(hoverValue).not.toBe(initialValue);
  }

  /**
   * Verify color matches expected design token
   */
  async verifyColor(element: Locator, property: string, expectedColor: string) {
    const color = await element.evaluate((el, prop) =>
      window.getComputedStyle(el).getPropertyValue(prop), property
    );
    expect(color).toBe(expectedColor);
  }

  /**
   * Check if element is visible and has content
   */
  async verifyVisibleWithContent(element: Locator) {
    await expect(element).toBeVisible();
    const text = await element.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  }

  /**
   * Verify responsive behavior at different viewports
   */
  async testAtViewport(
    viewport: keyof typeof UxAuditPageObject.VIEWPORTS,
    testFn: () => Promise<void>
  ) {
    const size = UxAuditPageObject.VIEWPORTS[viewport];
    await this.page.setViewportSize(size);
    await testFn();
  }

  /**
   * Verify element has data-test attribute (for reliable selectors)
   */
  async verifyHasTestId(element: Locator) {
    const testId = await element.getAttribute('data-test');
    expect(testId).not.toBeNull();
  }

  /**
   * Verify all buttons have proper styling
   */
  async verifyButtonStyling(button: Locator) {
    // Check cursor
    const cursor = await button.evaluate((el) =>
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');

    // Check it's not disabled unless expected
    const disabled = await button.isDisabled();
    if (!disabled) {
      await this.verifyHoverState(button);
    }
  }

  /**
   * Verify form input styling
   */
  async verifyInputStyling(input: Locator) {
    await expect(input).toBeVisible();

    // Check border
    const borderColor = await input.evaluate((el) =>
      window.getComputedStyle(el).borderColor
    );
    expect(borderColor).toBeTruthy();

    // Verify focus ring
    await this.verifyFocusState(input);
  }

  /**
   * Check for console errors during page load
   */
  async checkForConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    return errors;
  }

  /**
   * Verify page loads without network errors
   */
  async verifyNoNetworkErrors() {
    const failedRequests: string[] = [];

    this.page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
    });

    // Wait for network to settle
    await this.page.waitForLoadState('networkidle');

    expect(failedRequests).toHaveLength(0);
  }

  /**
   * Calculate visual hierarchy score based on font sizes
   */
  async verifyVisualHierarchy(elements: { locator: Locator; role: 'h1' | 'h2' | 'h3' | 'body' }[]) {
    const sizes: Record<string, number> = {};

    for (const { locator, role } of elements) {
      const fontSize = await locator.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );
      sizes[role] = fontSize;
    }

    // Verify hierarchy: h1 > h2 > h3 > body
    if (sizes.h1 && sizes.h2) expect(sizes.h1).toBeGreaterThan(sizes.h2);
    if (sizes.h2 && sizes.h3) expect(sizes.h2).toBeGreaterThan(sizes.h3);
    if (sizes.h3 && sizes.body) expect(sizes.h3).toBeGreaterThan(sizes.body);
  }

  /**
   * Verify loading states are shown properly
   */
  async verifyLoadingState(triggerAction: () => Promise<void>, loadingSelector: string) {
    const loadingPromise = this.page.waitForSelector(loadingSelector, { state: 'visible' });
    await triggerAction();
    await loadingPromise;
    // Verify loading eventually disappears
    await expect(this.page.locator(loadingSelector)).toBeHidden({ timeout: 30000 });
  }

  /**
   * Verify transitions are smooth (not instant)
   */
  async verifyTransition(element: Locator, property: string = 'transition') {
    const transition = await element.evaluate((el, prop) =>
      window.getComputedStyle(el).getPropertyValue(prop), property
    );
    expect(transition).not.toBe('all 0s ease 0s');
  }
}
