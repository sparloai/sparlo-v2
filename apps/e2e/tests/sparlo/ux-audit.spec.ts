import { expect, test } from '@playwright/test';

/**
 * UX/UI Audit Test Suite for Sparlo
 *
 * This suite evaluates the application against premium UX standards:
 * - Visual Polish: Typography, spacing, alignment, color harmony
 * - Interaction Quality: Transitions, loading states, feedback
 * - Information Architecture: Hierarchy, scannability, clarity
 * - Trust Signals: Professional polish, consistency, attention to detail
 *
 * Tests run against production: https://sparlo.ai
 */

const PRODUCTION_URL = 'https://sparlo.ai';
const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

// Helper to ensure authenticated state
async function ensureAuthenticated(page: any) {
  // Navigate to home - will redirect to auth if needed
  await page.goto(`${PRODUCTION_URL}/home`);

  // Check if we're on auth page
  const isAuthPage = page.url().includes('/auth') || page.url().includes('/sign-in');

  if (isAuthPage) {
    // Fill in credentials
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for redirect to home
    await page.waitForURL(/\/home/, { timeout: 10000 });
  }

  // Verify we're authenticated
  await expect(page.url()).toContain('/home');
}

test('New Report Page - Visual Polish & Hierarchy', async ({ page }) => {
    await ensureAuthenticated(page);

    // Navigate to new report page
    await page.goto(`${PRODUCTION_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');

    // Take baseline screenshot
    await page.screenshot({
      path: 'test-results/ux-audit/new-report-baseline.png',
      fullPage: true
    });

    // AUDIT 1: Typography Hierarchy
    const textarea = page.locator('textarea[data-test="challenge-input"]');
    await expect(textarea).toBeVisible();

    // Check placeholder text
    const placeholder = await textarea.getAttribute('placeholder');
    console.log('📝 Placeholder text:', placeholder);

    // AUDIT 2: Visual Feedback on Input
    await textarea.fill('I need to reduce heat sink weight by 40%');
    await page.waitForTimeout(500); // Wait for any debounced updates

    // Check if context detection indicators appear
    const contextIndicators = page.locator('text=/Technical Goals|Material Constraints|Cost Parameters/');
    const indicatorCount = await contextIndicators.count();
    console.log(`🎯 Context indicators detected: ${indicatorCount}`);

    await page.screenshot({
      path: 'test-results/ux-audit/new-report-with-input.png',
      fullPage: true
    });

    // AUDIT 3: Submit Button State & Polish
    const submitButton = page.locator('button[data-test="challenge-submit"]');
    await expect(submitButton).toBeVisible();

    // Check button is enabled with sufficient input
    const isEnabled = await submitButton.isEnabled();
    console.log(`✅ Submit button enabled with input: ${isEnabled}`);

    // AUDIT 4: Trust Signals Visibility
    const trustSignals = page.locator('text=/DATA NEVER TRAINS AI|SOC2 INFRASTRUCTURE/');
    const trustSignalCount = await trustSignals.count();
    console.log(`🔒 Trust signals visible: ${trustSignalCount}`);

    // AUDIT 5: Attachment Feature
    const attachButton = page.locator('button:has-text("Attach")');
    await expect(attachButton).toBeVisible();

    await attachButton.screenshot({
      path: 'test-results/ux-audit/attach-button.png'
    });
  });

  test('New Report Page - Responsive Behavior', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${PRODUCTION_URL}/home/reports/new`);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'test-results/ux-audit/new-report-tablet.png',
      fullPage: true
    });

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'test-results/ux-audit/new-report-mobile.png',
      fullPage: true
    });

    // Verify key elements are still accessible on mobile
    const textarea = page.locator('textarea[data-test="challenge-input"]');
    await expect(textarea).toBeVisible();

    const submitButton = page.locator('button[data-test="challenge-submit"]');
    await expect(submitButton).toBeVisible();

    // Check if keyboard shortcut hint is hidden on mobile (should be)
    const keyboardHint = page.locator('kbd');
    const isKeyboardHintVisible = await keyboardHint.first().isVisible();
    console.log(`⌨️ Keyboard hints visible on mobile: ${isKeyboardHintVisible} (should be false)`);

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
});

test('New Report Page - Color Contrast & Accessibility', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${PRODUCTION_URL}/home/reports/new`);

    // Check for sufficient color contrast on key elements
    const textarea = page.locator('textarea[data-test="challenge-input"]');
    const textareaColor = await textarea.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        color: computed.color,
        background: computed.backgroundColor,
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
      };
    });

    console.log('🎨 Textarea styles:', textareaColor);

    // Check focus states
    await textarea.focus();
    await page.screenshot({
      path: 'test-results/ux-audit/textarea-focused.png',
    });

    // Check submit button focus
    const submitButton = page.locator('button[data-test="challenge-submit"]');
    await submitButton.focus();
    await page.screenshot({
      path: 'test-results/ux-audit/submit-button-focused.png',
    });
});

test('New Report Page - Input Quality Indicators', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${PRODUCTION_URL}/home/reports/new`);
    const textarea = page.locator('textarea[data-test="challenge-input"]');

    // Test 1: Very short input
    await textarea.fill('Short');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: 'test-results/ux-audit/input-too-short.png',
      fullPage: true
    });

    // Test 2: Input with technical goals
    await textarea.fill('I need to reduce weight by 40% while maintaining thermal performance.');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/ux-audit/input-with-goals.png',
      fullPage: true
    });

    // Test 3: Input with materials and constraints
    await textarea.fill('I need to reduce weight by 40% while maintaining thermal performance. The constraint is that we must use aluminum materials and keep cost under $5 per unit.');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'test-results/ux-audit/input-comprehensive.png',
      fullPage: true
    });

    // Check context detection responsiveness
    const detectedContexts = await page.locator('[class*="violet"]').count();
    console.log(`🎯 Detected context indicators: ${detectedContexts}`);
});

test('Navigation & Information Architecture', async ({ page }) => {
    await ensureAuthenticated(page);
    // Start from home
    await page.goto(`${PRODUCTION_URL}/home`);
    await page.screenshot({
      path: 'test-results/ux-audit/home-page.png',
      fullPage: true
    });

    // Check for clear navigation to reports
    const newReportLink = page.locator('a[href*="/reports/new"], button:has-text("New")').first();
    if (await newReportLink.isVisible()) {
      console.log('✅ Clear path to new report found');
      await newReportLink.screenshot({
        path: 'test-results/ux-audit/new-report-cta.png'
      });
    } else {
      console.log('❌ No clear path to new report - ISSUE');
    }

    // Check for reports list/history
    const reportsSection = page.locator('text=/Reports|History|Past Analysis/i').first();
    if (await reportsSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Reports history section found');
    } else {
      console.log('⚠️ No obvious reports history section');
    }
});

test('Overall Page Load Performance', async ({ page }) => {
    await ensureAuthenticated(page);
    const startTime = Date.now();

    await page.goto(`${PRODUCTION_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`⚡ Page load time: ${loadTime}ms`);

    if (loadTime > 3000) {
      console.log('⚠️ Page load exceeds 3s - consider optimization');
    }

    // Check for any layout shifts
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: 'test-results/ux-audit/after-settle.png',
      fullPage: true
    });
});

test('Dark Mode Consistency', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${PRODUCTION_URL}/home/reports/new`);

    // Take screenshot in current mode
    await page.screenshot({
      path: 'test-results/ux-audit/current-theme.png',
      fullPage: true
    });

    // Try to find and toggle theme switcher
    const themeSwitcher = page.locator('[aria-label*="theme"], button:has-text("Dark"), button:has-text("Light")').first();

    if (await themeSwitcher.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('✅ Theme switcher found');
      await themeSwitcher.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'test-results/ux-audit/toggled-theme.png',
        fullPage: true
      });
    } else {
      console.log('ℹ️ No theme switcher found - checking system preference');

      // Emulate dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.reload();
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'test-results/ux-audit/dark-mode-forced.png',
        fullPage: true
      });
    }
});

test('Error States & Edge Cases', async ({ page }) => {
    await ensureAuthenticated(page);
    await page.goto(`${PRODUCTION_URL}/home/reports/new`);

    // Test: Submit with empty input
    const submitButton = page.locator('button[data-test="challenge-submit"]');
    const isDisabled = await submitButton.isDisabled();
    console.log(`✅ Submit disabled when empty: ${isDisabled}`);

    await submitButton.screenshot({
      path: 'test-results/ux-audit/submit-disabled-state.png'
    });

    // Test: Input just under minimum
    const textarea = page.locator('textarea[data-test="challenge-input"]');
    await textarea.fill('Too short input here');

    await page.waitForTimeout(300);
    const stillDisabled = await submitButton.isDisabled();
    console.log(`✅ Submit disabled with insufficient input: ${stillDisabled}`);

    await page.screenshot({
      path: 'test-results/ux-audit/insufficient-input.png',
      fullPage: true
    });
});
