import { chromium } from 'playwright';

/**
 * Standalone production docs sidebar test
 * Run with: npx ts-node prod-docs-test.ts
 */
async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const BASE_URL = 'https://sparlo.ai';

  try {
    console.log('1. Navigating to sign-in page...');
    await page.goto(`${BASE_URL}/auth/sign-in`);
    await page.waitForLoadState('networkidle');

    console.log('2. Filling in credentials...');
    await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
    await page.fill('input[name="password"]', 'Linguine2025');

    console.log('3. Clicking sign in...');
    await page.click('button[type="submit"]');

    console.log('4. Waiting for redirect to home...');
    await page.waitForURL('**/home**', { timeout: 30000 });

    console.log('5. Taking screenshot of home page...');
    await page.screenshot({ path: 'test-results/prod-home.png' });

    console.log('6. Navigating to docs...');
    await page.goto(`${BASE_URL}/docs`);
    await page.waitForLoadState('networkidle');

    console.log('7. Taking screenshot of docs page...');
    await page.screenshot({ path: 'test-results/prod-docs-logged-in.png' });

    // Check for sidebar toggle
    const sidebarToggle = page.getByTestId('docs-sidebar-toggle');
    const toggleVisible = await sidebarToggle.isVisible().catch(() => false);

    console.log(`8. Sidebar toggle visible: ${toggleVisible}`);

    if (toggleVisible) {
      console.log('9. Clicking sidebar toggle...');
      await sidebarToggle.click();
      await page.waitForTimeout(500);

      console.log('10. Taking screenshot with sidebar open...');
      await page.screenshot({ path: 'test-results/prod-docs-sidebar-open.png' });

      // Check sidebar content
      const sidebarPanel = page.getByTestId('docs-sidebar-panel');
      const panelVisible = await sidebarPanel.isVisible().catch(() => false);
      console.log(`    Sidebar panel visible: ${panelVisible}`);

      if (panelVisible) {
        const newAnalysis = await sidebarPanel.getByText('New Analysis').isVisible().catch(() => false);
        const allReports = await sidebarPanel.getByText('All Reports').isVisible().catch(() => false);
        const settings = await sidebarPanel.getByText('Settings').isVisible().catch(() => false);
        const logOut = await sidebarPanel.getByText('Log out').isVisible().catch(() => false);

        console.log(`    - New Analysis: ${newAnalysis}`);
        console.log(`    - All Reports: ${allReports}`);
        console.log(`    - Settings: ${settings}`);
        console.log(`    - Log out: ${logOut}`);
      }

      console.log('11. Pressing Escape to close sidebar...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.screenshot({ path: 'test-results/prod-docs-sidebar-closed.png' });
    } else {
      console.log('WARNING: Sidebar toggle NOT visible - feature may not be deployed');

      // Take detailed screenshots to debug
      const header = page.locator('header');
      if (await header.isVisible()) {
        await header.screenshot({ path: 'test-results/prod-docs-header.png' });
      }
    }

    // Check if user dropdown is hidden
    console.log('12. Checking header nav visibility...');
    const headerNav = page.locator('header nav > div.hidden.md\\:flex');
    const navStyle = await headerNav.evaluate((el) => {
      return window.getComputedStyle(el).visibility;
    }).catch(() => 'unknown');
    console.log(`    Header nav visibility: ${navStyle}`);

    // Check docs navigation
    const gettingStarted = page.getByText('Getting Started');
    const docsNavVisible = await gettingStarted.isVisible().catch(() => false);
    console.log(`13. Docs navigation visible: ${docsNavVisible}`);

    console.log('14. Taking final screenshot...');
    await page.screenshot({ path: 'test-results/prod-docs-final.png', fullPage: true });

    console.log('\n✅ Test completed successfully!');
    console.log('Screenshots saved to test-results/ directory');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'test-results/prod-error.png' });
  } finally {
    await browser.close();
  }
}

runTest();
