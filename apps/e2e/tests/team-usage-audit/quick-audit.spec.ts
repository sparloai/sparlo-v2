/**
 * Quick Team Usage Audit - Direct Page Navigation
 *
 * This test assumes you're already logged in (via browser session)
 * Run with: npx playwright test quick-audit --project=ux-audit --headed
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TEAM_SLUG = 'audit-team';
const screenshotsDir = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Quick Team Usage Audit', () => {
  test('Capture Team Billing Page', async ({ page }) => {
    // Navigate directly to team billing
    await page.goto(`/home/${TEAM_SLUG}/billing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for data to load

    // Take screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'team-billing-full.png'),
      fullPage: true,
    });

    console.log('Screenshot saved: team-billing-full.png');

    // Check for key elements
    const pageContent = await page.content();

    console.log('\n=== BILLING PAGE AUDIT ===');
    console.log('URL:', page.url());
    console.log('Has "usage" text:', pageContent.toLowerCase().includes('usage'));
    console.log('Has "%" text:', pageContent.includes('%'));
    console.log('Has "tokens" text:', pageContent.toLowerCase().includes('tokens'));
    console.log('Has "member" text:', pageContent.toLowerCase().includes('member'));
    console.log('Has "report" text:', pageContent.toLowerCase().includes('report'));

    // Check for left border accent (Sparlo design)
    const hasLeftBorder = await page.locator('.border-l-2').first().isVisible().catch(() => false);
    console.log('Has Sparlo left border accent:', hasLeftBorder);
  });

  test('Capture Team Members Page', async ({ page }) => {
    await page.goto(`/home/${TEAM_SLUG}/members`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotsDir, 'team-members-full.png'),
      fullPage: true,
    });

    console.log('Screenshot saved: team-members-full.png');
    console.log('\n=== MEMBERS PAGE AUDIT ===');
    console.log('URL:', page.url());
  });

  test('Capture Team Settings Page', async ({ page }) => {
    await page.goto(`/home/${TEAM_SLUG}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotsDir, 'team-settings-full.png'),
      fullPage: true,
    });

    console.log('Screenshot saved: team-settings-full.png');
    console.log('\n=== SETTINGS PAGE AUDIT ===');
    console.log('URL:', page.url());
  });

  test('Capture Team Dashboard Page', async ({ page }) => {
    await page.goto(`/home/${TEAM_SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(screenshotsDir, 'team-dashboard-full.png'),
      fullPage: true,
    });

    console.log('Screenshot saved: team-dashboard-full.png');
    console.log('\n=== DASHBOARD PAGE AUDIT ===');
    console.log('URL:', page.url());
  });
});
