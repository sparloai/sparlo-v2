import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'https://sparlo.ai';

// Skip auth - this tests public landing page
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Landing Page Mode Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    // Dismiss cookie banner if present
    const gotItButton = page.getByText('Got it');
    if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotItButton.click();
    }
  });

  test('desktop: tabs display correctly with proper styling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Scroll down past hero to find tabs
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);

    // Verify both tabs exist
    const engineersTab = page.getByRole('button', { name: /For Engineers/i });
    const vcsTab = page.getByRole('button', { name: /For VCs/i });

    await expect(engineersTab).toBeVisible({ timeout: 15000 });
    await expect(vcsTab).toBeVisible();

    // Take screenshot of tabs area
    await page.screenshot({
      path: 'tests/screenshots/mode-tabs-desktop-engineers.png',
      fullPage: false,
    });

    // Click For VCs tab
    await vcsTab.click();
    await page.waitForTimeout(400);

    // Take screenshot of VCs selected state
    await page.screenshot({
      path: 'tests/screenshots/mode-tabs-desktop-vcs.png',
      fullPage: false,
    });

    // Verify URL hash changed
    expect(page.url()).toContain('#investors');
  });

  test('mobile: tabs display correctly with proper spacing', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 });

    // Scroll down past hero to find tabs
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(500);

    // Verify both tabs exist and are visible
    const engineersTab = page.getByRole('button', { name: /For Engineers/i });
    const vcsTab = page.getByRole('button', { name: /For VCs/i });

    await expect(engineersTab).toBeVisible({ timeout: 15000 });
    await expect(vcsTab).toBeVisible();

    // Take screenshot of mobile tabs
    await page.screenshot({
      path: 'tests/screenshots/mode-tabs-mobile-engineers.png',
      fullPage: false,
    });

    // Click For VCs tab
    await vcsTab.click();
    await page.waitForTimeout(400);

    // Take screenshot of VCs selected on mobile
    await page.screenshot({
      path: 'tests/screenshots/mode-tabs-mobile-vcs.png',
      fullPage: false,
    });
  });

  test('tab switching updates content sections', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Scroll down past hero
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);

    // Verify Engineers content is shown by default
    await expect(
      page.getByText('Input a detailed technical challenge'),
    ).toBeVisible({ timeout: 15000 });

    // Click For VCs tab
    const vcsTab = page.getByRole('button', { name: /For VCs/i });
    await vcsTab.click();
    await page.waitForTimeout(500);

    // Verify VCs content is shown
    await expect(
      page.getByText('Upload a pitch deck or investment memo'),
    ).toBeVisible();
    await expect(page.getByText('Claims Extraction')).toBeVisible();
  });

  test('deep link /#investors loads VCs tab directly', async ({ page }) => {
    await page.goto(`${BASE_URL}/#investors`);
    await page.waitForLoadState('networkidle');

    // Dismiss cookie banner if present
    const gotItButton = page.getByText('Got it');
    if (await gotItButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await gotItButton.click();
    }

    // Scroll down past hero
    await page.evaluate(() => window.scrollBy(0, 800));
    await page.waitForTimeout(500);

    // Verify VCs content is shown
    await expect(
      page.getByText('Upload a pitch deck or investment memo'),
    ).toBeVisible({ timeout: 15000 });
  });
});
