import { test } from '@playwright/test';

const SITE_URL = 'https://sparlo.ai';
const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/phase2';

test('Capture completed report view', async ({ page }) => {
  // Login
  await page.goto(`${SITE_URL}/auth/sign-in`);
  await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
  await page.fill('input[name="password"]', 'Linguine2025');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');

  // Click first completed report (green dot)
  await page.waitForTimeout(1000);

  // Get the first report link that isn't processing
  const reportCards = await page.locator('a[href*="/reports/"]').all();

  for (const card of reportCards.slice(0, 5)) {
    const cardText = await card.textContent();
    // Skip processing reports
    if (!cardText?.includes('PROCESSING')) {
      await card.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      break;
    }
  }

  // Screenshot top of report
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/16-completed-report-top.png`,
  });

  // Full report screenshot
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/17-completed-report-full.png`,
    fullPage: true
  });

  // Scroll to show content
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/18-report-content-section.png`,
  });

  // Scroll more to show innovations/solutions
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/19-report-innovations-section.png`,
  });
});
