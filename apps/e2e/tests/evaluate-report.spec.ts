import { test } from '@playwright/test';

test('evaluate report page in light mode', async ({ page }) => {
  // Force light mode
  await page.emulateMedia({ colorScheme: 'light' });

  // Go to login page on PRODUCTION
  await page.goto('https://sparlo.ai/auth/sign-in');
  await page.waitForLoadState('networkidle');

  // Login
  await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
  await page.fill('input[name="password"]', 'Linguine2025');
  await page.click('button[type="submit"]');

  // Wait for redirect after login (just needs to leave sign-in page)
  await page.waitForURL(/.*\/home.*/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // Navigate to reports
  await page.goto('https://sparlo.ai/home/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Take screenshot of reports list
  await page.screenshot({
    path: 'test-results/reports-list-light.png',
    fullPage: true
  });
  console.log('Screenshot: reports-list-light.png');

  // Click first report card to go to detail
  const firstReportCard = page.locator('[class*="report"], [class*="card"]').first();
  if (await firstReportCard.count() > 0) {
    await firstReportCard.click();
  } else {
    // Fallback: click the first clickable report row
    await page.locator('a').filter({ hasText: '[ANALYSIS]' }).first().click();
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Screenshot of report detail - top
  await page.screenshot({
    path: 'test-results/report-detail-top.png',
    fullPage: false
  });

  // Full page screenshot
  await page.screenshot({
    path: 'test-results/report-detail-full.png',
    fullPage: true
  });

  console.log('Screenshots saved to test-results/');
});
