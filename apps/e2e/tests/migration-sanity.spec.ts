import { test, expect } from '@playwright/test';

/**
 * Sanity test for /home -> /app migration
 * Tests that authentication and navigation work correctly after the route change
 */
test.describe('Migration Sanity Check', () => {
  test('login redirects to /app', async ({ page }) => {
    // Go to sign in
    await page.goto('/auth/sign-in');

    // Fill in credentials
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.click('button[type="submit"]');

    // Should redirect to /app after login
    await page.waitForURL('**/app**', { timeout: 30000 });

    // Verify we're on the app page
    expect(page.url()).toContain('/app');
    expect(page.url()).not.toContain('/home');

    console.log('Successfully logged in and redirected to /app');
    console.log('Current URL:', page.url());
  });

  test('sidebar links use /app prefix', async ({ page }) => {
    // Login first
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 30000 });

    // Check that sidebar links use /app prefix
    const sidebarLinks = page.locator('nav a[href^="/app"]');
    const linkCount = await sidebarLinks.count();

    console.log(`Found ${linkCount} links with /app prefix`);
    expect(linkCount).toBeGreaterThan(0);

    // Verify no links use /home
    const homeLinks = page.locator('a[href^="/home"]');
    const homeLinkCount = await homeLinks.count();
    console.log(`Found ${homeLinkCount} links with /home prefix (should be 0)`);
    expect(homeLinkCount).toBe(0);

    // Log all /app links found
    for (let i = 0; i < linkCount; i++) {
      const href = await sidebarLinks.nth(i).getAttribute('href');
      console.log(`  Link ${i + 1}: ${href}`);
    }
  });

  test('navigate to billing page', async ({ page }) => {
    // Login first
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 30000 });

    // Click on billing/usage link
    const billingLink = page.locator('a[href="/app/billing"]').first();
    if (await billingLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await billingLink.click();
      await page.waitForLoadState('networkidle');

      const url = page.url();
      console.log('Billing page URL:', url);

      expect(url).toContain('/app/billing');
      expect(url).not.toContain('/home');
    } else {
      console.log('Billing link not found in sidebar');
    }
  });

  test('navigate to new analysis page', async ({ page }) => {
    // Login first
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app**', { timeout: 30000 });

    // Click on new analysis link
    const newAnalysisLink = page.locator('a[href="/app/reports/new"]').first();
    if (await newAnalysisLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newAnalysisLink.click();
      await page.waitForLoadState('networkidle');

      const url = page.url();
      console.log('New Analysis page URL:', url);

      expect(url).toContain('/app/reports/new');
      expect(url).not.toContain('/home');
    } else {
      console.log('New Analysis link not found');
    }
  });
});
