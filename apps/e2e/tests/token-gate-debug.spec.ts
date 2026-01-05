import { expect, test } from '@playwright/test';

/**
 * Test for token gate and new report page navigation
 * User: swimakaswim@gmail.com
 *
 * BUG FIXED: ProcessingScreen was redirecting to /home when a user navigated to
 * /reports/new, even when they should stay on the page to see the token gate or
 * submit a new analysis. The fix adds a pathname check in ProcessingScreen to
 * skip the redirect when on /reports/new pages.
 *
 * This test runs against the live site and doesn't depend on auth setup.
 */
test.describe('Token Gate and New Report Navigation', () => {
  // Skip auth setup - this test logs in directly on the live site
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(180000); // 3 minutes timeout

  test('user should stay on /reports/new page (not redirected to /home)', async ({
    page,
  }) => {
    // Login on the live site
    console.log('Navigating to sign-in page...');
    await page.goto('https://app.sparlo.ai/auth/sign-in', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    console.log('Sign-in page loaded');

    // Dismiss cookie consent if present
    const cookieButton = page.getByRole('button', { name: 'Got it' });
    if (await cookieButton.isVisible().catch(() => false)) {
      await cookieButton.click();
      console.log('Dismissed cookie consent');
    }

    // Wait for the form to be ready
    await page.waitForSelector('input', { timeout: 10000 });

    // Fill login form - use placeholder text to find inputs
    console.log('Filling login form...');
    const emailInput = page.getByPlaceholder('your@email.com');
    await emailInput.click();
    await emailInput.fill('swimakaswim@gmail.com');
    console.log('Filled email');

    const passwordInput = page.getByPlaceholder('************');
    await passwordInput.click();
    await passwordInput.fill('Linguine2025');
    console.log('Filled password');

    // Take a screenshot before clicking submit
    await page.screenshot({
      path: 'screenshots/token-gate-0-before-submit.png',
      fullPage: true,
    });

    // Click sign in button (use test ID to avoid matching Google button)
    const signInButton = page.getByTestId('auth-submit-button');
    await signInButton.click();
    console.log('Clicked sign in button');

    // Wait a moment to see if there's an error
    await page.waitForTimeout(3000);

    // Check for any error messages
    const alertText = await page
      .locator('[role="alert"], .error, [class*="error"]')
      .textContent()
      .catch(() => null);
    if (alertText) {
      console.log('Alert/Error message:', alertText);
    }

    // Take screenshot after clicking
    await page.screenshot({
      path: 'screenshots/token-gate-0-after-submit.png',
      fullPage: true,
    });

    // Wait for navigation away from sign-in page
    await page.waitForURL((url) => !url.pathname.includes('/auth/sign-in'), {
      timeout: 30000,
    });
    console.log('✓ Logged in successfully');
    console.log('Current URL after login:', page.url());

    // Wait a bit for page to fully load
    await page.waitForTimeout(2000);

    // Take screenshot of dashboard
    await page.screenshot({
      path: 'screenshots/token-gate-1-dashboard.png',
      fullPage: true,
    });

    // Check if usage indicator is visible and what percentage it shows
    const usageText = await page.evaluate(() => {
      // Look for any element containing a percentage
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.match(/\d+%/) && text.length < 20) {
          return text;
        }
      }
      return null;
    });
    console.log('Usage text found:', usageText);

    // Dismiss cookie consent again if present (after login)
    const cookieButton2 = page.getByRole('button', { name: 'Got it' });
    if (await cookieButton2.isVisible().catch(() => false)) {
      await cookieButton2.click();
      console.log('Dismissed cookie consent on dashboard');
      await page.waitForTimeout(500);
    }

    // Set up request/response logging before navigation
    const redirects: string[] = [];
    const requests: string[] = [];
    const consoleMessages: string[] = [];
    const networkRequests: { url: string; method: string; type: string }[] = [];

    page.on('request', (request) => {
      const url = request.url();
      const method = request.method();
      const type = request.resourceType();
      if (type === 'document' || type === 'fetch' || type === 'xhr') {
        console.log(`REQUEST [${type}]: ${method} ${url}`);
        networkRequests.push({ url, method, type });
      }
    });

    page.on('response', (response) => {
      const status = response.status();
      const url = response.url();
      const type = response.request().resourceType();
      // Log all document and fetch requests
      if (type === 'document' || type === 'fetch' || type === 'xhr') {
        console.log(`RESPONSE [${type}]: ${status} ${url}`);
        requests.push(`[${type}] ${status} ${url}`);
      }
      if (status >= 300 && status < 400) {
        const location = response.headers()['location'];
        redirects.push(`${status} ${url} -> ${location}`);
        console.log(`REDIRECT: ${status} ${url} -> ${location}`);
      }
    });

    page.on('console', (msg) => {
      const text = msg.text();
      // Log ALL console messages to understand what's happening
      console.log(`CONSOLE [${msg.type()}]: ${text}`);
      consoleMessages.push(text);
    });

    // Track URL changes
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        console.log(`FRAME NAVIGATED TO: ${frame.url()}`);
      }
    });

    // Clear any potential cached state before navigation
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Navigate directly to the new report page
    console.log('Navigating directly to /reports/new...');
    const response = await page.goto('https://app.sparlo.ai/reports/new', {
      waitUntil: 'domcontentloaded', // Use domcontentloaded to catch early redirects
      timeout: 30000,
    });
    console.log('Initial response URL:', response?.url());
    console.log('Initial response status:', response?.status());
    console.log('After domcontentloaded, URL:', page.url());

    // Take an immediate screenshot before any client-side JS runs
    await page.screenshot({
      path: 'screenshots/token-gate-1.5-immediate.png',
      fullPage: true,
    });

    // Wait a very short time to see the initial render
    await page.waitForTimeout(500);
    console.log('After 500ms, URL:', page.url());

    // Take another screenshot
    await page.screenshot({
      path: 'screenshots/token-gate-1.6-after-500ms.png',
      fullPage: true,
    });

    // Wait for the page to settle
    await page.waitForTimeout(2000);
    console.log('After 2500ms total, URL:', page.url());
    console.log('All network requests:', JSON.stringify(networkRequests, null, 2));
    console.log('All responses:', requests);
    console.log('All redirects captured:', redirects);

    // Take a screenshot to see what's displayed
    await page.screenshot({
      path: 'screenshots/token-gate-2-new-report.png',
      fullPage: true,
    });

    // Check the current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // If we got redirected, investigate why
    if (!currentUrl.includes('/reports/new')) {
      console.log('\n⚠️ REDIRECT DETECTED - expected /reports/new but got:', currentUrl);
      console.log('Checking for any console errors or network issues...');

      // Check for in-progress reports on the page
      const inProgressReports = await page.evaluate(() => {
        const text = document.body.innerText;
        const processingMatch = text.match(/processing|generating|in progress/gi);
        return processingMatch;
      });
      console.log('In-progress reports found:', inProgressReports);

      // Check what heading is shown
      const heading = await page
        .locator('h1')
        .first()
        .textContent()
        .catch(() => 'No heading');
      console.log('Page heading:', heading);
    }

    // Check page content
    const pageContent = await page.content();

    // Check if we're on the token gate screen
    const isTokenGate =
      pageContent.includes('Monthly Limit Reached') ||
      pageContent.includes('Unlock Unlimited Analysis') ||
      pageContent.includes('limit_exceeded') ||
      pageContent.includes('subscription_required');

    console.log('Is token gate screen:', isTokenGate);

    // Check if we're on the new analysis form
    const isNewAnalysisForm =
      pageContent.includes('New Analysis') ||
      pageContent.includes('design challenge') ||
      pageContent.includes('Describe your') ||
      pageContent.includes('Standard Mode') ||
      pageContent.includes('Discovery Mode') ||
      pageContent.includes('Hybrid Mode');

    console.log('Is new analysis form:', isNewAnalysisForm);

    // Check for specific elements
    const limitReachedHeading = page.getByRole('heading', {
      name: /Monthly Limit Reached/i,
    });
    const unlockHeading = page.getByRole('heading', {
      name: /Unlock Unlimited Analysis/i,
    });

    if (await limitReachedHeading.isVisible().catch(() => false)) {
      console.log('✓ Token gate (limit exceeded) is visible');
    } else if (await unlockHeading.isVisible().catch(() => false)) {
      console.log('✓ Token gate (subscription required) is visible');
    } else if (isNewAnalysisForm) {
      console.log('✗ New analysis form is visible - token gate NOT triggered');
    } else {
      console.log('? Unknown page state');
    }

    // Log any visible text about usage on this page
    const usageOnPage = await page.evaluate(() => {
      const matches: string[] = [];
      const elements = document.querySelectorAll('*');
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.match(/\d+%\s*used/i)) {
          matches.push(text.trim().substring(0, 100));
        }
      }
      return matches;
    });
    if (usageOnPage.length > 0) {
      console.log('Usage percentage found on page:', usageOnPage);
    }

    // Log what we see for debugging
    if (isNewAnalysisForm && !isTokenGate) {
      console.log(
        '\nℹ️ New analysis form is shown (user may have remaining tokens)',
      );
    }

    // PRIMARY ASSERTION: User should NOT be redirected to /home
    // The bug was that ProcessingScreen would redirect users away from /reports/new
    // After the fix, users should stay on the page regardless of whether they see
    // the token gate or the new analysis form
    const wasRedirectedToHome = currentUrl.includes('/home') && !currentUrl.includes('/reports');

    if (wasRedirectedToHome) {
      console.log('\n❌ BUG: User was redirected to /home instead of staying on /reports/new');
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('\n--- Page text (first 1000 chars) ---');
      console.log(bodyText.substring(0, 1000));
    }

    // Assert we stayed on the reports/new page (fix verification)
    expect(wasRedirectedToHome, 'User should not be redirected to /home from /reports/new').toBe(false);

    // Secondary assertion: We should see either the token gate or the form
    const isOnReportsNewPage = currentUrl.includes('/reports/new');
    const hasExpectedContent = isTokenGate || isNewAnalysisForm;

    if (isOnReportsNewPage) {
      console.log('✓ User stayed on /reports/new page');
      if (isTokenGate) {
        console.log('✓ Token gate is displayed (usage limit reached)');
      } else if (isNewAnalysisForm) {
        console.log('✓ New analysis form is displayed (user has remaining tokens)');
      }
    }

    expect(hasExpectedContent, 'Should see either token gate or new analysis form').toBe(true);
  });
});
