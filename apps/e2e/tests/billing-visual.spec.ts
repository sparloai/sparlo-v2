import { test, expect } from '@playwright/test';

import { AuthPageObject } from './authentication/auth.po';

// Skip the default setup - we use our own credentials
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Billing Page Visual Test', () => {
  test('should display Aura pricing page for non-subscriber', async ({ page }) => {
    const auth = new AuthPageObject(page);

    // Login with provided credentials
    await auth.goToSignIn();
    await auth.signIn({
      email: 'swimakaswim@gmail.com',
      password: 'Linguine2025',
    });

    // Wait for redirect to home (longer timeout for live deployment)
    await page.waitForURL('**/home**', { timeout: 30000 });

    // Navigate to billing page
    await page.goto('/home/billing');

    // Verify the Aura pricing page is displayed
    await expect(page.locator('h1')).toContainText('Plans');

    // Verify the three pricing tiers are visible
    await expect(page.locator('text=$199')).toBeVisible();
    await expect(page.locator('text=$499')).toBeVisible();
    await expect(page.locator('text=$999')).toBeVisible();

    // Verify plan names
    await expect(page.locator('text=Core')).toBeVisible();
    await expect(page.locator('text=Pro')).toBeVisible();
    await expect(page.locator('text=Max')).toBeVisible();

    // Take a screenshot for visual verification
    await page.screenshot({ path: 'billing-page.png', fullPage: true });
  });
});
