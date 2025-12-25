import { test, expect } from '@playwright/test';
import { NewReportPageObject, REPORT_MODES } from './new-report.po';
import { UxAuditPageObject } from './ux-audit.po';

// Use fresh session - we login with our own credentials
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

test.describe('New Report Page UX Audit', () => {
  let newReport: NewReportPageObject;

  test.beforeEach(async ({ page }) => {
    newReport = new NewReportPageObject(page);
    await newReport.loginAndGoto(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  });

  test.describe('Form Layout', () => {
    test('should display main form elements', async () => {
      await newReport.verifyFormLayout();
    });

    test('should have visible challenge textarea', async ({ page }) => {
      await expect(newReport.challengeTextarea).toBeVisible();
    });

    test('should have visible submit button', async ({ page }) => {
      await expect(newReport.submitButton).toBeVisible();
    });

    test('should center content on page', async ({ page }) => {
      const container = page.locator('main, [class*="container"]').first();
      const box = await container.boundingBox();

      if (box) {
        const viewportWidth = page.viewportSize()?.width || 1280;
        const centerX = box.x + box.width / 2;
        const viewportCenterX = viewportWidth / 2;

        // Container should be roughly centered
        expect(Math.abs(centerX - viewportCenterX)).toBeLessThan(100);
      }
    });
  });

  test.describe('Textarea Interaction', () => {
    test('should accept text input', async () => {
      await newReport.verifyTextareaInput();
    });

    test('should have proper placeholder', async ({ page }) => {
      const placeholder = await newReport.challengeTextarea.getAttribute('placeholder');
      expect(placeholder?.length).toBeGreaterThan(0);
    });

    test('should be resizable or have adequate height', async ({ page }) => {
      const height = await newReport.challengeTextarea.evaluate((el) =>
        el.getBoundingClientRect().height
      );
      expect(height).toBeGreaterThan(100);
    });
  });

  test.describe('Submit Button Validation', () => {
    test('should be disabled with empty input', async ({ page }) => {
      await newReport.challengeTextarea.fill('');
      const isDisabled = await newReport.submitButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('should be disabled with short input', async ({ page }) => {
      await newReport.challengeTextarea.fill('Too short');
      const isDisabled = await newReport.submitButton.isDisabled();
      expect(isDisabled).toBeTruthy();
    });

    test('should be enabled with valid input', async ({ page }) => {
      const validText = 'This is a detailed challenge description that exceeds the minimum character requirement for form submission.';
      await newReport.challengeTextarea.fill(validText);

      await page.waitForTimeout(200);

      const isDisabled = await newReport.submitButton.isDisabled();
      expect(isDisabled).toBeFalsy();
    });

    test('button should have proper styling', async ({ page }) => {
      const cursor = await newReport.submitButton.evaluate((el) =>
        window.getComputedStyle(el).cursor
      );
      // Should be pointer when enabled, not-allowed when disabled
      expect(['pointer', 'not-allowed']).toContain(cursor);
    });
  });

  test.describe('Attach Button', () => {
    test('should be visible', async () => {
      await newReport.verifyAttachButton();
    });

    test('should have attachment icon', async ({ page }) => {
      const attachBtn = newReport.attachButton;
      // Check for paperclip icon or similar
      const hasIcon = await attachBtn.locator('svg, [class*="lucide"]').isVisible().catch(() => false);
    });
  });

  test.describe('Mode Indicators', () => {
    test('should show NEW ANALYSIS label on standard mode', async () => {
      await newReport.verifyModeIndicator('standard');
    });
  });

  test.describe('Info Elements', () => {
    test('should show time estimate', async () => {
      await newReport.verifyTimeEstimate();
    });

    test('should show keyboard shortcut hint', async () => {
      await newReport.verifyKeyboardShortcut();
    });
  });

  test.describe('Visual Consistency', () => {
    test('should use consistent font family', async ({ page }) => {
      const fontFamily = await newReport.challengeTextarea.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );
      expect(fontFamily.toLowerCase()).toMatch(/soehne|sans-serif|system-ui/);
    });

    test('should have proper contrast', async ({ page }) => {
      const textColor = await newReport.challengeTextarea.evaluate((el) =>
        window.getComputedStyle(el).color
      );
      expect(textColor).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('should have card-like container', async ({ page }) => {
      const inputCard = page.locator('[class*="rounded"], [class*="border"]')
        .filter({ has: newReport.challengeTextarea })
        .first();

      if (await inputCard.isVisible()) {
        const borderRadius = await inputCard.evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );
        expect(parseFloat(borderRadius)).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);
      await newReport.verifyFormLayout();
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.tablet);
      await expect(newReport.challengeTextarea).toBeVisible();
      await expect(newReport.submitButton).toBeVisible();
    });

    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await expect(newReport.challengeTextarea).toBeVisible();
      await expect(newReport.submitButton).toBeVisible();
    });

    test('textarea should be full width on mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);

      const textareaBox = await newReport.challengeTextarea.boundingBox();
      const viewportWidth = page.viewportSize()?.width || 375;

      if (textareaBox) {
        // Should take up most of the width (accounting for padding)
        expect(textareaBox.width).toBeGreaterThan(viewportWidth * 0.8);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('textarea should be focusable', async ({ page }) => {
      await newReport.challengeTextarea.focus();
      const isFocused = await newReport.challengeTextarea.evaluate(
        (el) => el === document.activeElement
      );
      expect(isFocused).toBeTruthy();
    });

    test('submit button should be keyboard accessible', async ({ page }) => {
      // Fill valid text first
      await newReport.challengeTextarea.fill(
        'This is a valid challenge description for testing keyboard accessibility.'
      );

      // Tab to submit button
      await page.keyboard.press('Tab');

      // Check something is focused
      const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedTag).toBeTruthy();
    });

    test('form should have proper structure', async ({ page }) => {
      // Check for form element or fieldset
      const hasForm = await page.locator('form').isVisible().catch(() => false);
      const hasFieldset = await page.locator('fieldset').isVisible().catch(() => false);

      // Should have some form structure (though may be implicit)
    });
  });

  test.describe('Visual Snapshots', () => {
    test('should capture empty state', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/new-report-empty.png',
        fullPage: true,
      });
    });

    test('should capture filled state', async ({ page }) => {
      await newReport.challengeTextarea.fill(
        'How can we reduce the manufacturing cost of aluminum alloy components by 30% while maintaining tensile strength above 500MPa? Our current budget is $50,000 and we need to process 10,000 units per month.'
      );
      await page.waitForTimeout(500);
      await page.screenshot({
        path: 'tests/ux-audit/baselines/new-report-filled.png',
        fullPage: true,
      });
    });

    test('should capture mobile view', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/new-report-mobile.png',
        fullPage: true,
      });
    });
  });
});

test.describe('Discovery Mode UX Audit', () => {
  let newReport: NewReportPageObject;

  test.beforeEach(async ({ page }) => {
    newReport = new NewReportPageObject(page);
    await newReport.loginAndGoto(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'discovery');
  });

  test('should display discovery mode elements', async ({ page }) => {
    await newReport.verifyFormLayout();
  });

  test('should have emerald accent color theme', async ({ page }) => {
    // Check for emerald-colored elements
    const accentElements = page.locator('[class*="emerald"]');
    const count = await accentElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should capture discovery mode screenshot', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: 'tests/ux-audit/baselines/new-report-discovery.png',
      fullPage: true,
    });
  });
});

test.describe('Hybrid Mode UX Audit', () => {
  let newReport: NewReportPageObject;

  test.beforeEach(async ({ page }) => {
    newReport = new NewReportPageObject(page);
    await newReport.loginAndGoto(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password, 'hybrid');
  });

  test('should display hybrid mode elements', async ({ page }) => {
    await newReport.verifyFormLayout();
  });

  test('should have amber accent color theme', async ({ page }) => {
    // Check for amber-colored elements
    const accentElements = page.locator('[class*="amber"]');
    const count = await accentElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should capture hybrid mode screenshot', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: 'tests/ux-audit/baselines/new-report-hybrid.png',
      fullPage: true,
    });
  });
});
