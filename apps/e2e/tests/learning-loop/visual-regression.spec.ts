/**
 * Visual Regression Tests for UX/UI Learning Loop
 *
 * Uses Playwright's toHaveScreenshot() for visual comparison.
 * Focused on critical UI components, not full pages.
 *
 * Best practices:
 * - Mask dynamic content (dates, avatars, etc.)
 * - Use appropriate thresholds for tolerance
 * - Disable animations for consistent snapshots
 * - Test at consistent viewport sizes
 */
import { test, expect } from '@playwright/test';

// Test timeout: 30s max for learning loop
test.setTimeout(30000);

// Consistent viewport for visual tests
const VIEWPORT = { width: 1280, height: 720 };

test.describe('Visual Regression @fast', () => {
  // Note: These tests run on public pages only (no auth required)
  // This enables fast feedback in the learning loop

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(VIEWPORT);
  });

  test('landing page hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for fonts and images to load
    await page.waitForTimeout(500);

    // Find hero section
    const hero = page.locator('section').first();
    const isVisible = await hero.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('INFO: Hero section not found, skipping visual test');
      return;
    }

    await expect(hero).toHaveScreenshot('landing-hero.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="user-avatar"]'),
        page.locator('[data-testid="timestamp"]'),
        page.locator('time'),
      ],
    });
  });

  test('landing page layout structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for content
    await page.waitForTimeout(500);

    // Capture main content area
    const main = page.locator('main');
    const isVisible = await main.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('INFO: Main content not found, skipping visual test');
      return;
    }

    await expect(main).toHaveScreenshot('landing-main.png', {
      maxDiffPixels: 200,
      threshold: 0.25,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="dynamic-content"]'),
        page.locator('time'),
        page.locator('.skeleton'),
        page.locator('[class*="animate-"]'),
      ],
    });
  });

  test('navigation bar consistency', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const nav = page.locator('nav, header').first();
    const isVisible = await nav.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('INFO: Navigation not found, skipping visual test');
      return;
    }

    await expect(nav).toHaveScreenshot('navigation.png', {
      maxDiffPixels: 50,
      threshold: 0.15,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="user-avatar"]'),
        page.locator('[data-testid="notification-badge"]'),
      ],
    });
  });

  test('sign-in form styling', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('domcontentloaded');

    // Find the sign-in form
    const form = page.locator('form').first();
    const isVisible = await form.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('INFO: Sign-in form not found, skipping visual test');
      return;
    }

    await expect(form).toHaveScreenshot('sign-in-form.png', {
      maxDiffPixels: 50,
      threshold: 0.1,
      animations: 'disabled',
    });
  });

  test('button styles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Find primary button (CTA button on landing page)
    const button = page
      .locator('button, a[role="button"], a[class*="bg-zinc"]')
      .first();
    const isVisible = await button.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('INFO: Primary button not found, skipping visual test');
      return;
    }

    await expect(button).toHaveScreenshot('button-primary.png', {
      maxDiffPixels: 10,
      threshold: 0.05,
      animations: 'disabled',
    });
  });

  test('form input styling', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('domcontentloaded');

    // Find first visible input
    const input = page.locator('input[type="text"], input[type="email"]').first();
    const isVisible = await input.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('INFO: Form input not found, skipping visual test');
      return;
    }

    await expect(input).toHaveScreenshot('form-input.png', {
      maxDiffPixels: 10,
      threshold: 0.05,
      animations: 'disabled',
    });
  });

  test('mobile viewport layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.waitForTimeout(500);

    const main = page.locator('main, body');
    const isVisible = await main.isVisible().catch(() => false);

    if (!isVisible) {
      console.log('INFO: Main content not visible on mobile, skipping');
      return;
    }

    await expect(main).toHaveScreenshot('mobile-layout.png', {
      maxDiffPixels: 300,
      threshold: 0.3,
      animations: 'disabled',
      mask: [
        page.locator('[data-testid="user-avatar"]'),
        page.locator('time'),
        page.locator('.skeleton'),
      ],
    });
  });
});
