import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'swimakaswim@gmail.com';
const TEST_PASSWORD = 'Linguine2025';

test.describe('Three Lenses UX Audit - Screenshot Capture', () => {
  test('Landing Page - Capture all sections', async ({ page }) => {
    await page.goto('https://sparlo.ai');
    await page.waitForLoadState('networkidle');

    // Full page screenshot
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/landing-full.png',
      fullPage: true
    });

    // Hero section
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/landing-hero.png',
    });

    // Scroll to example reports
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/landing-sectors.png',
    });

    // Scroll further
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/landing-examples.png',
    });
  });

  test('Home Dashboard - Authenticated view', async ({ page }) => {
    // Login
    await page.goto('https://sparlo.ai/auth/sign-in');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Dashboard screenshot
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/dashboard-full.png',
      fullPage: true
    });

    // Just the header and reports section
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/dashboard-viewport.png',
    });
  });

  test('Navigation Sidebar - Open and capture', async ({ page }) => {
    // Login
    await page.goto('https://sparlo.ai/auth/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Open sidebar
    const hamburger = page.locator('button').filter({ has: page.locator('[class*="lucide-menu"]') }).first();
    await hamburger.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/ux-audit/screenshots/sidebar-open.png',
    });
  });

  test('New Report Page - Input form', async ({ page }) => {
    // Login
    await page.goto('https://sparlo.ai/auth/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });

    // Go to new report
    await page.goto('https://sparlo.ai/home/reports/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Empty state
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/new-report-empty.png',
    });

    // With text entered
    const textarea = page.locator('textarea').first();
    await textarea.fill('We need to develop a biodegradable plastic alternative that can withstand temperatures up to 120°C while maintaining structural integrity for food packaging applications. Current PLA alternatives degrade too quickly.');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/ux-audit/screenshots/new-report-filled.png',
    });
  });

  test('Report View - If available', async ({ page }) => {
    // Login
    await page.goto('https://sparlo.ai/auth/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Click first completed report if available
    const completedReport = page.locator('[class*="bg-emerald"]').first();
    if (await completedReport.isVisible({ timeout: 3000 }).catch(() => false)) {
      const reportCard = completedReport.locator('..').locator('..');
      await reportCard.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'tests/ux-audit/screenshots/report-view-top.png',
      });

      await page.screenshot({
        path: 'tests/ux-audit/screenshots/report-view-full.png',
        fullPage: true
      });
    }
  });

  test('Mobile Views - Responsive audit', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Landing mobile
    await page.goto('https://sparlo.ai');
    await page.waitForLoadState('networkidle');
    await page.screenshot({
      path: 'tests/ux-audit/screenshots/mobile-landing.png',
    });

    // Login and dashboard mobile
    await page.goto('https://sparlo.ai/auth/sign-in');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'tests/ux-audit/screenshots/mobile-dashboard.png',
    });

    // New report mobile
    await page.goto('https://sparlo.ai/home/reports/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'tests/ux-audit/screenshots/mobile-new-report.png',
    });
  });
});
