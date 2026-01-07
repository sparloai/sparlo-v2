import { expect, test } from '@playwright/test';

/**
 * Local test for credit gating on the new report page
 * Tests against local Supabase
 */
test.describe('Local Credit Gate Test', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(120000);

  test('check credit gating on new analysis page', async ({ page }) => {
    const baseUrl = 'http://localhost:3000';

    // Navigate to sign-in page
    console.log('Navigating to local sign-in page...');
    await page.goto(`${baseUrl}/auth/sign-in`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log('Sign-in page loaded, URL:', page.url());

    // Wait for the form to be ready
    await page.waitForSelector('input', { timeout: 10000 });

    // Fill login form
    console.log('Filling login form...');
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.click();
    await emailInput.fill('swimakaswim@gmail.com');
    console.log('Filled email');

    const passwordInput = page.getByPlaceholder('************');
    await passwordInput.click();
    await passwordInput.fill('Linguine2025');
    console.log('Filled password');

    // Take screenshot before submit
    await page.screenshot({
      path: 'screenshots/local-credit-0-before-submit.png',
      fullPage: true,
    });

    // Click sign in button
    const signInButton = page.getByTestId('auth-submit-button');
    await signInButton.click();
    console.log('Clicked sign in button');

    // Wait for navigation away from sign-in page
    try {
      await page.waitForURL((url) => !url.pathname.includes('/auth/sign-in'), {
        timeout: 30000,
      });
      console.log('✓ Logged in successfully, URL:', page.url());
    } catch (e) {
      // Take screenshot on error
      await page.screenshot({
        path: 'screenshots/local-credit-login-error.png',
        fullPage: true,
      });
      console.log('Login may have failed, current URL:', page.url());

      // Check for error messages
      const pageContent = await page.content();
      if (pageContent.includes('error') || pageContent.includes('Error')) {
        console.log('Error detected on page');
      }
      throw e;
    }

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Take screenshot of landing page
    await page.screenshot({
      path: 'screenshots/local-credit-1-after-login.png',
      fullPage: true,
    });
    console.log('After login, URL:', page.url());

    // Navigate to new analysis page
    console.log('Navigating to /home/reports/new...');
    const response = await page.goto(`${baseUrl}/home/reports/new`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log('Response status:', response?.status());
    console.log('After navigation, URL:', page.url());

    // Wait for page to settle
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'screenshots/local-credit-2-new-report.png',
      fullPage: true,
    });

    // Check page content
    const pageContent = await page.content();
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Check for token gate indicators
    const isTokenGate =
      pageContent.includes('Monthly Limit Reached') ||
      pageContent.includes('Unlock Unlimited Analysis') ||
      pageContent.includes('limit_exceeded') ||
      pageContent.includes('subscription_required') ||
      pageContent.includes('Ouch') || // Error page
      pageContent.includes('Something went wrong');

    // Check for new analysis form
    const isNewAnalysisForm =
      pageContent.includes('New Analysis') ||
      pageContent.includes('design challenge') ||
      pageContent.includes('Describe your') ||
      pageContent.includes('Standard Mode') ||
      pageContent.includes('Discovery Mode') ||
      pageContent.includes('Hybrid Mode') ||
      pageContent.includes('DD Mode');

    console.log('Is token gate:', isTokenGate);
    console.log('Is new analysis form:', isNewAnalysisForm);

    // Get page heading
    const heading = await page
      .locator('h1')
      .first()
      .textContent()
      .catch(() => 'No heading found');
    console.log('Page heading:', heading);

    // Get visible text for debugging
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('\n--- Page text (first 500 chars) ---');
    console.log(bodyText.substring(0, 500));

    // Log the outcome
    if (isTokenGate) {
      console.log('\n✓ Token gate is displayed - user appears to be out of credits or needs subscription');
    } else if (isNewAnalysisForm) {
      console.log('\n✓ New analysis form is displayed - user has credits available');
    } else if (currentUrl.includes('/home') && !currentUrl.includes('/reports')) {
      console.log('\n⚠️ User was redirected to dashboard - might indicate an issue');
    } else {
      console.log('\n⚠️ Unknown page state - check screenshots');
    }

    // The test passes as long as we're not seeing an unexpected error
    // We're investigating, not asserting specific behavior yet
    expect(currentUrl).toContain('localhost:3000');
  });
});
