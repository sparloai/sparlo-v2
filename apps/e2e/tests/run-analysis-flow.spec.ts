import { test, expect } from '@playwright/test';
import { AuthPageObject } from './authentication/auth.po';

// Use fresh session - we login with our own credentials (from CLAUDE.md)
test.use({ storageState: { cookies: [], origins: [] } });

// Generate unique email for each test run to avoid rate limits
const uniqueId = Date.now();
const TEST_CREDENTIALS = {
  email: `test-analysis-${uniqueId}@example.com`,
  password: 'Linguine2025',
  name: 'Test Analysis User',
};

const VALID_CHALLENGE_TEXT = `We need to reduce the weight of our aluminum heat sink by 40% while maintaining thermal performance above 95% of current levels.

The current design uses 6061-T6 aluminum with a finned structure. We have a budget of $75,000 for prototyping and testing. The heat sink must dissipate 150W of thermal load in a constrained 100x100x50mm envelope.

Key constraints:
- Must maintain structural integrity under vibration (5-500Hz)
- Operating temperature range: -40°C to +85°C
- Production volume: 10,000 units/year
- Must be compatible with existing mounting interface`;

test.describe('Run Analysis Full Flow', () => {
  let auth: AuthPageObject;

  test.beforeEach(async ({ page }) => {
    auth = new AuthPageObject(page);
  });

  test('should show processing screen and handle clarification flow', async ({ page }) => {
    // Increase timeout for this test as it involves Inngest processing
    test.setTimeout(180000); // 3 minutes

    // Step 1: Bootstrap user and login
    try {
      await auth.bootstrapUser({
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
        name: TEST_CREDENTIALS.name,
      });
    } catch (e) {
      // User may already exist, that's fine
      console.log('[Test] User may already exist:', e);
    }

    await auth.loginAsUser({
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    });

    // Step 2: Navigate to new report page
    await page.goto('/app/reports/new');
    await page.waitForLoadState('domcontentloaded');

    // Step 3: Fill in the challenge text
    const challengeInput = page.getByTestId('challenge-input');
    await expect(challengeInput).toBeVisible({ timeout: 10000 });
    await challengeInput.fill(VALID_CHALLENGE_TEXT);

    // Step 4: Submit the form
    const submitButton = page.getByTestId('challenge-submit');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Scroll button into view and click
    await submitButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await submitButton.click({ force: true });

    // Wait for processing screen to appear
    await page.waitForTimeout(2000);

    // Step 5: Verify we see the processing screen OR navigate to a report page
    // The processing screen shows "Reviewing your challenge" OR we might be on /app/reports/[id]
    const processingOrReport = await Promise.race([
      page.waitForSelector('text=Reviewing your challenge', { state: 'visible', timeout: 30000 }).then(() => 'processing'),
      page.waitForURL('**/app/reports/**', { timeout: 30000 }).then(() => 'report-page'),
    ]);

    // If we're on a report page, the report was created successfully
    if (processingOrReport === 'report-page') {
      // Look for the processing screen content
      const hasProcessingContent = await page.locator('text=/Reviewing|Analyzing|Researching|Generating|Building/').isVisible({ timeout: 10000 }).catch(() => false);
      expect(hasProcessingContent).toBeTruthy();
      return;
    }

    // If we see the processing screen directly
    if (processingOrReport === 'processing') {
      await expect(page.getByText('Reviewing your challenge')).toBeVisible();
    }

    // Step 6: Wait for either clarification, error, or completion
    const clarificationOrNext = await Promise.race([
      page.waitForSelector('[data-test^="clarification-option-"]', { state: 'visible', timeout: 120000 }).then(() => 'clarification'),
      page.waitForSelector('text=/Something went wrong|Query Not Accepted/', { state: 'visible', timeout: 120000 }).then(() => 'error'),
      page.waitForSelector('text=Analysis Complete', { state: 'visible', timeout: 120000 }).then(() => 'complete'),
    ]);

    if (clarificationOrNext === 'error') {
      const errorText = await page.locator('text=/Something went wrong|Query Not Accepted/').textContent();
      throw new Error(`Report generation failed: ${errorText}`);
    }

    if (clarificationOrNext === 'clarification') {
      // Try to click the first clarification option
      const firstOption = page.locator('[data-test^="clarification-option-"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
        await page.waitForTimeout(2000);
      }
    }

    // Verify we're past the initial phases
    const isProcessingOrComplete = await page.locator('text=/Analyzing|Researching|Generating|Building|Analysis Complete|Safe to close/').isVisible({ timeout: 60000 }).catch(() => false);
    expect(isProcessingOrComplete || clarificationOrNext === 'processing' || clarificationOrNext === 'complete').toBeTruthy();
  });

  test('should display processing screen elements correctly', async ({ page }) => {
    test.setTimeout(120000);

    // Bootstrap user and login
    try {
      await auth.bootstrapUser({
        email: TEST_CREDENTIALS.email,
        password: TEST_CREDENTIALS.password,
        name: TEST_CREDENTIALS.name,
      });
    } catch (e) {
      // User may already exist
      console.log('[Test] User may already exist:', e);
    }

    await auth.loginAsUser({
      email: TEST_CREDENTIALS.email,
      password: TEST_CREDENTIALS.password,
    });

    // Go to new report page
    await page.goto('/app/reports/new');
    await page.waitForLoadState('domcontentloaded');

    // Fill and submit
    const challengeInput = page.getByTestId('challenge-input');
    await expect(challengeInput).toBeVisible({ timeout: 10000 });
    await challengeInput.fill(VALID_CHALLENGE_TEXT);

    const submitButton = page.getByTestId('challenge-submit');
    await expect(submitButton).toBeEnabled({ timeout: 5000 });

    // Scroll and click with force
    await submitButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await submitButton.click({ force: true });

    // Wait for processing screen
    await page.waitForTimeout(2000);

    // Verify processing screen shows (check for any processing-related text)
    const processingText = page.locator('text=/Reviewing your challenge|Analyzing|We may ask a clarifying question/');
    await expect(processingText.first()).toBeVisible({ timeout: 30000 });

    console.log('[Test] Processing screen elements verified');
  });
});
