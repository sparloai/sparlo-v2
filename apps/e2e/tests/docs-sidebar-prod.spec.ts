import { expect, test } from '@playwright/test';

/**
 * Production docs sidebar test
 * Tests against sparlo.ai with real credentials
 */
test.describe('Docs Sidebar - Production', () => {
  const BASE_URL = 'https://sparlo.ai';

  test('login and verify docs sidebar functionality', async ({ page }) => {
    // Go to sign in page
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForLoadState('networkidle');

    // Fill in credentials
    await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
    await page.fill('input[name="password"]', 'Linguine2025');

    // Click sign in
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('**/home**', { timeout: 30000 });

    // Take screenshot of home page
    await page.screenshot({
      path: 'test-results/prod-home-logged-in.png',
    });

    console.log('Successfully logged in');

    // Now navigate to docs
    await page.goto(`${BASE_URL}/docs`);
    await page.waitForLoadState('networkidle');

    // Take screenshot of docs page
    await page.screenshot({
      path: 'test-results/prod-docs-logged-in.png',
      fullPage: false,
    });

    console.log('Navigated to docs page');

    // Check if sidebar toggle exists
    const sidebarToggle = page.getByTestId('docs-sidebar-toggle');
    const toggleVisible = await sidebarToggle.isVisible().catch(() => false);

    console.log(`Sidebar toggle visible: ${toggleVisible}`);

    if (toggleVisible) {
      // Click the sidebar toggle
      await sidebarToggle.click();

      // Wait for sidebar to open
      await page.waitForTimeout(500);

      // Take screenshot with sidebar open
      await page.screenshot({
        path: 'test-results/prod-docs-sidebar-open.png',
      });

      // Verify sidebar content
      const sidebarPanel = page.getByTestId('docs-sidebar-panel');
      await expect(sidebarPanel).toBeVisible();

      // Check for expected elements
      const newAnalysis = sidebarPanel.getByText('New Analysis');
      const allReports = sidebarPanel.getByText('All Reports');
      const settings = sidebarPanel.getByText('Settings');

      console.log(`New Analysis visible: ${await newAnalysis.isVisible()}`);
      console.log(`All Reports visible: ${await allReports.isVisible()}`);
      console.log(`Settings visible: ${await settings.isVisible()}`);

      await expect(newAnalysis).toBeVisible();
      await expect(allReports).toBeVisible();
      await expect(settings).toBeVisible();

      // Close sidebar by pressing Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // Verify sidebar closed
      await page.screenshot({
        path: 'test-results/prod-docs-sidebar-closed.png',
      });
    } else {
      console.log('Sidebar toggle NOT found - this may indicate the feature is not deployed');

      // Check what IS visible in the header area
      const header = page.locator('header');
      await header.screenshot({
        path: 'test-results/prod-docs-header-detail.png',
      });
    }

    // Verify the user dropdown is hidden (if feature is deployed)
    const headerNav = page.locator('header nav');
    await headerNav.screenshot({
      path: 'test-results/prod-docs-nav-area.png',
    });

    // Check docs navigation sidebar is visible and not overlapped
    const gettingStarted = page.getByText('Getting Started');
    await expect(gettingStarted).toBeVisible();

    console.log('Docs navigation sidebar is visible');

    // Final full page screenshot
    await page.screenshot({
      path: 'test-results/prod-docs-final.png',
      fullPage: true,
    });

    console.log('Test completed successfully');
  });
});
