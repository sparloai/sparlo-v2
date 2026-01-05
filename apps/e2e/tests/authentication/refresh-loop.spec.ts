import { expect, test } from '@playwright/test';

/**
 * Tests for the auth refresh loop fix.
 *
 * The issue was that on app subdomain (app.sparlo.ai/), when visiting without auth:
 * 1. The pathname is '/' (rewrites don't change browser URL)
 * 2. '/' is not a "private route" (doesn't start with /home)
 * 3. If Supabase fired SIGNED_OUT on initial load, window.location.reload() was called
 * 4. This created an infinite refresh loop
 *
 * The fix tracks if the user ever had a session, and only reloads on SIGNED_OUT
 * if there was a previous session.
 */
test.describe('Auth refresh loop prevention', () => {
  // Skip auth setup - these tests check unauthenticated behavior
  test.use({ storageState: { cookies: [], origins: [] } });

  test('visiting /home without auth redirects to sign-in without refresh loop', async ({
    page,
  }) => {
    // Track page reloads
    let loadCount = 0;
    page.on('load', () => {
      loadCount++;
    });

    // Visit the home page without authentication
    await page.goto('/home');

    // Should redirect to sign-in page
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    // Wait a moment to ensure no refresh loop occurs
    await page.waitForTimeout(2000);

    // Should have loaded only once (initial) + redirect (second load)
    // If there was a refresh loop, loadCount would be much higher
    expect(loadCount).toBeLessThanOrEqual(2);
  });

  test('visiting root path / loads correctly without refresh loop', async ({
    page,
  }) => {
    // Track page reloads
    let loadCount = 0;
    page.on('load', () => {
      loadCount++;
    });

    // Visit the root path without authentication
    await page.goto('/');

    // Wait for the page to stabilize
    await page.waitForLoadState('networkidle');

    // Wait additional time to ensure no refresh loop
    await page.waitForTimeout(3000);

    // Should not have excessive reloads (refresh loop would cause many)
    // Allow up to 2 loads for any redirects
    expect(loadCount).toBeLessThanOrEqual(2);
  });

  test('visiting /auth/sign-in loads correctly without refresh loop', async ({
    page,
  }) => {
    // Track page reloads
    let loadCount = 0;
    page.on('load', () => {
      loadCount++;
    });

    // Visit the sign-in page
    await page.goto('/auth/sign-in');

    // Wait for the page to stabilize
    await page.waitForLoadState('networkidle');

    // Wait additional time to ensure no refresh loop
    await page.waitForTimeout(2000);

    // Should have exactly one load - no redirects or reloads
    expect(loadCount).toBe(1);

    // Verify we're still on the sign-in page
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
