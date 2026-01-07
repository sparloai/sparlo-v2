import { expect, test } from '@playwright/test';

/**
 * Tests for the auth refresh loop fix on app subdomain.
 *
 * The issue was that on app subdomain (app.sparlo.ai), when visiting without auth:
 * 1. The pathname is '/settings' (rewrites don't change browser URL)
 * 2. '/settings' is not a "private route" on main domain (doesn't start with /home)
 * 3. But on app subdomain, ALL paths should be private
 * 4. If Supabase fired SIGNED_OUT, window.location.reload() was called → infinite loop
 *
 * The fix:
 * - Detects app subdomain (app.sparlo.ai or localhost in tests)
 * - Treats ALL non-public paths as private on subdomain
 * - Uses state machine to prevent double redirects
 * - Debounces SIGNED_OUT to allow token refresh to complete
 * - Redirects to main domain for auth instead of reloading
 */
test.describe('App subdomain refresh loop prevention', () => {
  // Skip auth setup - these tests check unauthenticated behavior
  test.use({ storageState: { cookies: [], origins: [] } });

  /**
   * Test all the app subdomain routes that should be protected.
   * On localhost (which is treated as app subdomain), these paths should:
   * 1. Be detected as private routes
   * 2. Redirect to sign-in without looping
   */
  const protectedRoutes = [
    { path: '/', name: 'root (dashboard)' },
    { path: '/reports', name: 'reports list' },
    { path: '/new', name: 'new report' },
    { path: '/settings', name: 'settings' },
    { path: '/billing', name: 'billing' },
    { path: '/teams', name: 'teams' },
    { path: '/support', name: 'support' },
  ];

  for (const route of protectedRoutes) {
    test(`${route.name} (${route.path}) redirects to sign-in without refresh loop`, async ({
      page,
    }) => {
      // Track page loads to detect refresh loops
      let loadCount = 0;
      page.on('load', () => {
        loadCount++;
        console.log(`[Test] Page load #${loadCount} - URL: ${page.url()}`);
      });

      // Visit the protected route without authentication
      console.log(`[Test] Visiting ${route.path}...`);
      await page.goto(route.path);

      // Wait for any redirects to complete
      await page.waitForLoadState('networkidle');

      // Should redirect to sign-in page (either /auth/sign-in or main domain)
      // The auth listener redirects to main domain, but middleware might intercept first
      await expect(async () => {
        const url = page.url();
        const isOnAuthPage =
          url.includes('/auth/sign-in') || url.includes('/auth/sign-up');
        expect(isOnAuthPage).toBe(true);
      }).toPass({ timeout: 10000 });

      // Wait additional time to ensure no refresh loop occurs
      await page.waitForTimeout(3000);

      // Should have loaded at most 3 times:
      // 1. Initial page load
      // 2. Redirect to auth (middleware or auth listener)
      // 3. Possible second redirect if going through both
      // If there was a refresh loop, loadCount would be much higher (10+)
      expect(loadCount).toBeLessThanOrEqual(3);

      console.log(
        `[Test] ${route.name}: Completed with ${loadCount} loads - PASS`,
      );
    });
  }

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
