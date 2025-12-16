import { expect, test } from '@playwright/test';

test.describe('Sparlo Test Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to test-flow page (requires auth, may need to skip or mock)
    await page.goto('/home/test-flow');
  });

  test('displays configuration panel on load', async ({ page }) => {
    await expect(page.locator('[data-test="start-test-flow"]')).toBeVisible();
    await expect(page.locator('text=Test Flow Configuration')).toBeVisible();
  });

  test('can start test flow and see input phase', async ({ page }) => {
    // Start the flow
    await page.click('[data-test="start-test-flow"]');

    // Should see input textarea
    await expect(page.locator('[data-test="problem-input-textarea"]')).toBeVisible();
    await expect(page.locator('text=Sparlo')).toBeVisible();
  });

  test('can skip input and go directly to analyzing', async ({ page }) => {
    // Check "skip input" checkbox
    await page.check('input[type="checkbox"]');

    // Start the flow
    await page.click('[data-test="start-test-flow"]');

    // Should skip input and show analyzing
    await expect(page.locator('text=Analyzing your challenge')).toBeVisible({
      timeout: 2000,
    });
  });

  test('full flow: input → generating → complete → report', async ({ page }) => {
    // Set shorter durations for faster testing
    await page
      .locator('input[type="range"]')
      .first()
      .fill('500'); // Analyzing: 500ms
    await page
      .locator('input[type="range"]')
      .nth(1)
      .fill('2000'); // Generating: 2s

    // Start the flow
    await page.click('[data-test="start-test-flow"]');

    // Input phase
    await expect(page.locator('[data-test="problem-input-textarea"]')).toBeVisible();
    await expect(page.locator('[data-test="generate-report-button"]')).toBeVisible();

    // Submit
    await page.click('[data-test="generate-report-button"]');

    // Analyzing phase
    await expect(page.locator('text=Analyzing your challenge')).toBeVisible();

    // Generating phase
    await expect(page.locator('text=Sparlo is working')).toBeVisible({
      timeout: 5000,
    });

    // Wait for complete phase
    await expect(page.locator('text=Your report is ready')).toBeVisible({
      timeout: 10000,
    });

    // View report
    await page.click('[data-test="view-report-button"]');

    // Report view
    await expect(page.locator('[data-test="executive-summary"]')).toBeVisible();
    await expect(page.locator('[data-test="analysis-section"]')).toBeVisible();
    await expect(page.locator('[data-test="concepts-section"]')).toBeVisible();
    await expect(page.locator('[data-test="recommendation-section"]')).toBeVisible();
    await expect(page.locator('[data-test="next-steps-section"]')).toBeVisible();
  });

  test('can reset flow from complete phase', async ({ page }) => {
    // Skip input and use fast timings
    await page.check('input[type="checkbox"]');
    await page
      .locator('input[type="range"]')
      .first()
      .fill('500');
    await page
      .locator('input[type="range"]')
      .nth(1)
      .fill('2000');

    await page.click('[data-test="start-test-flow"]');

    // Wait for complete
    await expect(page.locator('text=Your report is ready')).toBeVisible({
      timeout: 10000,
    });

    // Reset
    await page.click('[data-test="reset-flow"]');

    // Should be back at config
    await expect(page.locator('[data-test="start-test-flow"]')).toBeVisible();
  });

  test('input quality indicator shows as user types', async ({ page }) => {
    await page.click('[data-test="start-test-flow"]');

    const textarea = page.locator('[data-test="problem-input-textarea"]');

    // Type short text
    await textarea.fill('Short text');
    await expect(page.locator('text=2 words')).toBeVisible();

    // Type longer text with constraint keywords
    await textarea.fill(
      'I need to reduce weight by 40% while maintaining thermal performance. The constraint is that we must use aluminum materials.',
    );

    // Should show quality indicators
    await expect(page.locator('text=Challenge')).toBeVisible();
    await expect(page.locator('text=Constraints')).toBeVisible();
  });

  test('report shows viability indicator', async ({ page }) => {
    // Skip to report view
    await page.check('input[type="checkbox"]');
    await page
      .locator('input[type="range"]')
      .first()
      .fill('500');
    await page
      .locator('input[type="range"]')
      .nth(1)
      .fill('2000');

    await page.click('[data-test="start-test-flow"]');
    await expect(page.locator('text=Your report is ready')).toBeVisible({
      timeout: 10000,
    });
    await page.click('[data-test="view-report-button"]');

    // Should show GREEN viability (from mock data)
    await expect(page.locator('text=GREEN')).toBeVisible();
    await expect(page.locator('text=Heat Sink Weight Reduction Analysis')).toBeVisible();
  });

  test('report displays lead concepts with metrics', async ({ page }) => {
    // Fast path to report
    await page.check('input[type="checkbox"]');
    await page
      .locator('input[type="range"]')
      .first()
      .fill('500');
    await page
      .locator('input[type="range"]')
      .nth(1)
      .fill('2000');

    await page.click('[data-test="start-test-flow"]');
    await expect(page.locator('text=Your report is ready')).toBeVisible({
      timeout: 10000,
    });
    await page.click('[data-test="view-report-button"]');

    // Check for lead concepts from mock data
    await expect(
      page.locator('text=Variable-Thickness Pin Fins with Microchannel Base'),
    ).toBeVisible();
    await expect(
      page.locator('text=Graphite-Aluminum Hybrid Baseplate'),
    ).toBeVisible();

    // Check for metrics
    await expect(page.locator('text=Weight Reduction')).toBeVisible();
    await expect(page.locator('text=High Confidence')).toBeVisible();
  });
});
