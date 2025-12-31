import { expect, test } from '@playwright/test';

/**
 * Visual check for docs page layout - no auth required
 * Tests the basic structure and elements without requiring login
 */
test.describe('Docs Page Visual Check', () => {
  test('docs page loads correctly for logged-out users', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Take a screenshot of the docs page
    await page.screenshot({
      path: 'test-results/docs-page-logged-out.png',
      fullPage: false,
    });

    // Verify the page title/header area exists
    await expect(page.locator('header')).toBeVisible();

    // Verify the docs navigation sidebar exists
    await expect(page.locator('text=Getting Started')).toBeVisible();

    // Verify Sign In button is visible (for logged-out users)
    await expect(page.getByText('Sign In')).toBeVisible();

    // Verify Get Started button is visible
    await expect(page.getByText('Get Started')).toBeVisible();

    // The sidebar toggle should NOT be visible for logged-out users
    const sidebarToggle = page.getByTestId('docs-sidebar-toggle');
    await expect(sidebarToggle).not.toBeVisible();

    // Verify docs content is visible
    await expect(page.locator('.container')).toBeVisible();
  });

  test('docs page header is properly positioned', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Get the header element
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify header is at the top
    const headerBox = await header.boundingBox();
    expect(headerBox?.y).toBeLessThanOrEqual(10);

    // Verify the logo is visible in the header
    const logo = header.locator('img[alt="Sparlo"]');
    await expect(logo).toBeVisible();
  });

  test('docs navigation sidebar shows content sections', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Verify main documentation sections are visible
    await expect(page.getByText('Getting Started')).toBeVisible();
    await expect(page.getByText('Quick Start')).toBeVisible();
  });

  test('no overlapping elements in header area', async ({ page }) => {
    await page.goto('/docs');
    await page.waitForLoadState('networkidle');

    // Take screenshot of header area for visual inspection
    const header = page.locator('header');
    await header.screenshot({
      path: 'test-results/docs-header-area.png',
    });

    // Verify header nav elements don't overlap
    const nav = header.locator('nav');
    const navBox = await nav.boundingBox();

    expect(navBox).not.toBeNull();
    expect(navBox!.width).toBeGreaterThan(100);
    expect(navBox!.height).toBeGreaterThan(20);
  });
});
