import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

// Skip auth - this tests public landing page
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Landing Page Mode Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('desktop: tabs display correctly with proper styling', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Verify both tabs exist
    await expect(page.getByText('For Engineers')).toBeVisible();
    await expect(page.getByText('For VCs')).toBeVisible();

    // Scroll to tabs area
    await page.getByText('For Engineers').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot of initial state (Engineers selected)
    await page.screenshot({
      path: 'tests/screenshots/mode-tabs-desktop-engineers.png',
      fullPage: false,
    });

    // Click For VCs tab
    await page.getByText('For VCs').click();
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

    // Verify both tabs exist and are visible
    await expect(page.getByText('For Engineers')).toBeVisible();
    await expect(page.getByText('For VCs')).toBeVisible();

    // Scroll to tabs
    await page.getByText('For Engineers').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot of mobile tabs
    await page.screenshot({
      path: 'tests/screenshots/mode-tabs-mobile-engineers.png',
      fullPage: false,
    });

    // Click For VCs tab
    await page.getByText('For VCs').click();
    await page.waitForTimeout(400);

    // Take screenshot of VCs selected on mobile
    await page.screenshot({
      path: 'tests/screenshots/mode-tabs-mobile-vcs.png',
      fullPage: false,
    });
  });

  test('tab switching updates content sections', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Verify Engineers content is shown by default
    await expect(
      page.getByText('Input a detailed technical challenge'),
    ).toBeVisible();

    // Click For VCs tab
    await page.getByText('For VCs').click();
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

    // Verify VCs content is shown
    await expect(
      page.getByText('Upload a pitch deck or investment memo'),
    ).toBeVisible();
  });
});
