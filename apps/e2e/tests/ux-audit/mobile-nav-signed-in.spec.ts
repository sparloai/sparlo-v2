import { test } from '@playwright/test';

const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/navigation';

test('Mobile nav when signed in', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  // Login
  await page.goto('https://sparlo.ai/auth/sign-in');
  await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
  await page.fill('input[name="password"]', 'Linguine2025');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home**', { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/20-mobile-signed-in-closed.png` });

  // Click hamburger (first button in header)
  const hamburger = page.locator('button').first();
  await hamburger.click();
  await page.waitForTimeout(600);

  await page.screenshot({ path: `${SCREENSHOT_DIR}/21-mobile-signed-in-drawer-open.png` });

  // Find drawer links
  const drawer = page.locator('[role="dialog"], [class*="drawer"], [class*="sheet"]').first();
  const links = drawer.locator('a');
  const count = await links.count();
  console.log(`Found ${count} drawer links`);

  // Test each link's hover state
  for (let i = 0; i < Math.min(5, count); i++) {
    const link = links.nth(i);
    if (await link.isVisible().catch(() => false)) {
      const text = await link.textContent();

      const before = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          color: s.color,
          borderLeft: s.borderLeft,
        };
      });

      await link.hover();
      await page.waitForTimeout(250);

      const after = await link.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          bg: s.backgroundColor,
          color: s.color,
          borderLeft: s.borderLeft,
        };
      });

      const changed = before.bg !== after.bg || before.color !== after.color;
      console.log(`"${text?.trim()}":`);
      console.log(`  Before: bg=${before.bg}, color=${before.color}`);
      console.log(`  After:  bg=${after.bg}, color=${after.color}`);
      console.log(`  Changed: ${changed ? 'YES' : 'NO'}`);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/22-drawer-link-${i + 1}-hover.png`,
      });
    }
  }

  // Test "New Analysis" button specifically
  const newAnalysis = drawer.locator('a:has-text("New Analysis"), button:has-text("New Analysis")').first();
  if (await newAnalysis.isVisible().catch(() => false)) {
    const before = await newAnalysis.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, boxShadow: s.boxShadow };
    });

    await newAnalysis.hover();
    await page.waitForTimeout(250);

    const after = await newAnalysis.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, color: s.color, boxShadow: s.boxShadow };
    });

    console.log('\nNew Analysis button:');
    console.log('  Before:', JSON.stringify(before));
    console.log('  After:', JSON.stringify(after));

    await page.screenshot({ path: `${SCREENSHOT_DIR}/23-new-analysis-hover.png` });
  }

  // Test close button
  const closeBtn = drawer.locator('button:has-text("×"), button[aria-label*="close"], button[aria-label*="Close"]').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.hover();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/24-close-button-hover.png` });
  }

  // Close drawer and capture animation
  await hamburger.click();
  await page.waitForTimeout(100); // Mid-animation
  await page.screenshot({ path: `${SCREENSHOT_DIR}/25-drawer-closing-animation.png` });

  await page.waitForTimeout(500);
  await page.screenshot({ path: `${SCREENSHOT_DIR}/26-drawer-closed.png` });
});
