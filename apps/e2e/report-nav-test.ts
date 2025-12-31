import { chromium } from 'playwright';

/**
 * Test to check report page navigation bar
 */
async function runTest() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
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
    await page.screenshot({ path: 'test-results/report-nav-home.png' });

    // Get a report ID from the recent reports
    console.log('6. Finding a report link...');
    const reportLink = page.locator('a[href^="/home/reports/"]').first();
    const reportHref = await reportLink.getAttribute('href');
    console.log(`   Found report: ${reportHref}`);

    if (reportHref) {
      console.log('7. Navigating to report...');
      await page.goto(`${BASE_URL}${reportHref}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Wait for animations

      console.log('8. Taking screenshot of report page...');
      await page.screenshot({ path: 'test-results/report-nav-report.png' });

      // Check header elements
      console.log('9. Checking header elements...');

      // Check for Sparlo logo in header
      const sparloLogo = page.locator('header img[alt="Sparlo"]');
      const logoVisible = await sparloLogo.isVisible().catch(() => false);
      console.log(`   Sparlo logo visible: ${logoVisible}`);

      // Check for usage indicator
      const usageIndicator = page.getByText(/Usage/i);
      const usageVisible = await usageIndicator.isVisible().catch(() => false);
      console.log(`   Usage indicator visible: ${usageVisible}`);

      // Check for header element
      const header = page.locator('header');
      const headerVisible = await header.isVisible().catch(() => false);
      console.log(`   Header visible: ${headerVisible}`);

      if (headerVisible) {
        await header.screenshot({ path: 'test-results/report-nav-header.png' });
      }

      // Take screenshot of top area
      console.log('10. Taking screenshot of top area...');
      await page.screenshot({
        path: 'test-results/report-nav-top.png',
        clip: { x: 0, y: 0, width: 1400, height: 100 }
      });
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    await page.screenshot({ path: 'test-results/report-nav-error.png' });
  } finally {
    await browser.close();
  }
}

runTest();
