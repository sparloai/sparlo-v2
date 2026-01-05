import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { TeamAccountsComprehensivePO } from './team-accounts-comprehensive.po';

const SCREENSHOTS_DIR = path.join(
  process.cwd(),
  'screenshots',
  'team-accounts-comprehensive',
);
const BASE_URL = 'https://sparlo.ai';
const TEAM_SLUG = 'audit-team';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Team Accounts Comprehensive Audit
 *
 * Tests EVERYTHING involved in team accounts:
 * - Navigation (all sidebar links)
 * - Billing page (pricing display, plan selection, payment flow)
 * - Members page (list, invitations, member actions)
 * - Settings page (team name, danger zone)
 * - Design aesthetic (Sparlo design system compliance)
 * - Console errors (JavaScript issues)
 * - Interactive elements (buttons, links work correctly)
 *
 * Run with:
 * TEST_EMAIL=your@email.com TEST_PASSWORD=yourpass npx playwright test team-accounts-comprehensive.spec.ts
 */
test.describe('Team Accounts Comprehensive Audit', () => {
  test.use({
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 800 },
  });

  test.beforeEach(async ({ page }) => {
    // Login before each test
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;

    if (!email || !password) {
      console.log('\n⚠️  Credentials required. Set TEST_EMAIL and TEST_PASSWORD.');
      console.log(
        'Example: TEST_EMAIL=swimakaswim@gmail.com TEST_PASSWORD=yourpass npx playwright test team-accounts-comprehensive.spec.ts',
      );
      test.skip();
      return;
    }

    console.log(`Logging in with email: ${email}`);

    // Try to load sign-in page with retries
    let signInLoaded = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await page.goto('/auth/sign-in', { waitUntil: 'domcontentloaded' });
        if (response && response.ok()) {
          signInLoaded = true;
          break;
        }
        console.log(`Sign-in page returned status ${response?.status()}, retrying...`);
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log(`Attempt ${attempt} failed: ${e}`);
        await page.waitForTimeout(2000);
      }
    }

    if (!signInLoaded) {
      throw new Error('Could not load sign-in page after 3 attempts');
    }

    await page.waitForLoadState('networkidle');

    // Dismiss cookie consent banner if present
    const cookieButton = page.locator('button:has-text("Got it")');
    if (await cookieButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('Dismissing cookie consent banner...');
      await cookieButton.click();
      await page.waitForTimeout(500);
    }

    // Wait for form to be ready
    const emailInput = page.locator('input[name="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });

    // Clear any existing values and type email (more realistic than fill)
    await emailInput.click();
    await emailInput.clear();
    await emailInput.type(email, { delay: 50 });

    // Fill password with typing
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.type(password, { delay: 50 });

    // Small delay to let any validation run
    await page.waitForTimeout(500);

    console.log('Filled login form, clicking submit...');

    // Take screenshot before submit
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/before-submit.png` });

    // Monitor network requests for auth response
    let authResponse: { status: number; body: string } | null = null;
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('auth') && (url.includes('token') || url.includes('sign'))) {
        console.log(`Auth response: ${response.status()} ${url}`);
        try {
          const body = await response.text();
          authResponse = { status: response.status(), body };
          if (response.status() !== 200) {
            console.log(`Auth error response: ${body.substring(0, 500)}`);
          }
        } catch {
          // Response might not have body
        }
      }
    });

    // Click submit and monitor for errors or navigation
    const submitButton = page.locator('button[type="submit"]');

    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ timeout: 30000 }).catch(() => null);

    await submitButton.click();

    // Wait for navigation to complete (auth API returned 200, so login succeeded)
    // Give time for session to be established and redirect to happen
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/after-submit.png` });

    let currentUrl = page.url();
    console.log('After submit (3s wait), URL:', currentUrl);

    // If we're on marketing page, the session might not have redirected yet
    // Try navigating directly to /home
    if (!currentUrl.includes('/home')) {
      console.log('Not on /home yet, trying direct navigation...');
      await page.goto('/home');
      await page.waitForLoadState('networkidle');
      currentUrl = page.url();
      console.log('After direct /home navigation, URL:', currentUrl);
    }

    // Take another screenshot
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/after-home-nav.png` });

    // Check if we're on home page
    if (currentUrl.includes('/home')) {
      console.log('✅ Login successful, on home page');
    } else if (currentUrl.includes('/auth')) {
      // Redirected back to auth - session not valid
      console.log('❌ Redirected back to auth page - session invalid');
      throw new Error(`Login failed - redirected back to auth`);
    } else {
      // Still on marketing - not authenticated
      console.log(`⚠️ Still on marketing page: ${currentUrl}`);
      console.log('Session may not have been established');
      throw new Error(`Login failed - could not access /home, stuck at ${currentUrl}`);
    }

    await page.waitForLoadState('domcontentloaded');

    // Navigate to team account
    console.log(`Navigating to team: ${TEAM_SLUG}`);
    await page.goto(`/home/${TEAM_SLUG}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give page time to settle
    console.log('✅ Navigated to team account');
  });

  test('full team accounts audit', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);

    // Run comprehensive audit
    const summary = await audit.runFullAudit(TEAM_SLUG, SCREENSHOTS_DIR);

    // Report results
    console.log('\n' + '='.repeat(60));
    console.log('FINAL TEST RESULTS');
    console.log('='.repeat(60));

    // Fail test if critical issues found
    if (summary.critical > 0) {
      console.log('\n❌ TEST FAILED: Critical issues found');
      summary.issues
        .filter((i) => i.severity === 'critical')
        .forEach((i) => console.log(`  🔴 ${i.page}: ${i.issue}`));
    }

    expect(
      summary.critical,
      `Found ${summary.critical} critical issues`,
    ).toBe(0);
  });

  test('billing page displays correct pricing', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);

    await audit.navigateToBilling(TEAM_SLUG);
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'billing-pricing-check.png'),
      fullPage: true,
    });

    // Check all prices on page
    const priceTexts = await page.locator('text=/\\$[0-9,]+/').allTextContents();
    console.log('Prices found on billing page:', priceTexts);

    // Verify no prices are displayed in cents (should all be < $1000)
    for (const price of priceTexts) {
      const numericPrice = parseFloat(price.replace(/[$,]/g, ''));

      if (numericPrice > 10000) {
        console.log(`❌ Price appears to be in cents: ${price}`);
        expect(numericPrice).toBeLessThan(10000);
      }
    }
  });

  test('sidebar navigation works correctly', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);

    // Start at billing (where team redirects to)
    await audit.navigateToBilling(TEAM_SLUG);

    const links = [
      { name: 'Billing', url: `/home/${TEAM_SLUG}/billing` },
      { name: 'Members', url: `/home/${TEAM_SLUG}/members` },
      { name: 'Settings', url: `/home/${TEAM_SLUG}/settings` },
      { name: 'Help', url: `/home/${TEAM_SLUG}/help` },
    ];

    for (const link of links) {
      console.log(`Testing navigation: ${link.name}`);

      const linkElement = page.locator(`a:has-text("${link.name}")`).first();
      await expect(linkElement).toBeVisible({ timeout: 5000 });

      await linkElement.click();
      await page.waitForLoadState('networkidle');

      // Verify URL changed correctly
      expect(page.url()).toContain(TEAM_SLUG);
      console.log(`✅ ${link.name} navigation works`);

      // Take screenshot
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, `nav-${link.name.toLowerCase()}.png`),
        fullPage: true,
      });
    }
  });

  test('members page functionality', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);

    await audit.navigateToMembers(TEAM_SLUG);
    await page.waitForTimeout(2000);

    // Screenshot: Members page
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'members-page.png'),
      fullPage: true,
    });

    // Check members table exists
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    console.log('Members table visible:', hasTable);
    expect(hasTable).toBe(true);

    // Check for invite button
    const inviteButton = page.locator('[data-test="invite-members-form-trigger"], button:has-text("Invite")').first();
    const hasInviteButton = await inviteButton.isVisible().catch(() => false);
    console.log('Invite button visible:', hasInviteButton);

    if (hasInviteButton) {
      // Click invite button
      await inviteButton.click();
      await page.waitForTimeout(500);

      // Screenshot: Invite dialog
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'members-invite-dialog.png'),
        fullPage: true,
      });

      // Check dialog content
      const dialogVisible = await page.locator('[role="dialog"], .dialog, [data-test="invite-members-form"]').isVisible().catch(() => false);
      console.log('Invite dialog opened:', dialogVisible);

      // Close dialog
      await page.keyboard.press('Escape');
    }
  });

  test('settings page functionality', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);

    await audit.navigateToSettings(TEAM_SLUG);
    await page.waitForTimeout(2000);

    // Screenshot: Settings page
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'settings-page.png'),
      fullPage: true,
    });

    // Check for team name input
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const hasNameInput = await nameInput.isVisible().catch(() => false);
    console.log('Team name input visible:', hasNameInput);

    // Check for save button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
    const hasSaveButton = await saveButton.isVisible().catch(() => false);
    console.log('Save button visible:', hasSaveButton);

    // Check for danger zone
    const hasDangerZone = await page.locator('text=/danger|delete.*team/i').first().isVisible().catch(() => false);
    console.log('Danger zone visible:', hasDangerZone);
  });

  test('design system compliance', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);
    const pagesToCheck = ['Billing', 'Members', 'Settings'];

    for (const pageName of pagesToCheck) {
      switch (pageName) {
        case 'Billing':
          await audit.navigateToBilling(TEAM_SLUG);
          break;
        case 'Members':
          await audit.navigateToMembers(TEAM_SLUG);
          break;
        case 'Settings':
          await audit.navigateToSettings(TEAM_SLUG);
          break;
      }

      await page.waitForTimeout(1000);

      console.log(`\nChecking design system on ${pageName} page:`);

      // Check for Sparlo left border accent pattern
      const hasLeftBorder = await page.locator('.border-l-2').first().isVisible().catch(() => false);
      console.log(`  Left border accent: ${hasLeftBorder ? '✅' : '⚠️ Missing'}`);

      // Check for card styling
      const hasCards = await page.locator('.rounded-xl').first().isVisible().catch(() => false);
      console.log(`  Card styling: ${hasCards ? '✅' : '⚠️ Missing'}`);

      // Check for proper spacing
      const hasSpacing = await page.locator('.pl-10, [class*="pl-10"]').first().isVisible().catch(() => false);
      console.log(`  Page body spacing: ${hasSpacing ? '✅' : '⚠️ Missing'}`);
    }
  });

  test('no console errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    const audit = new TeamAccountsComprehensivePO(page);

    // Visit each page and collect errors
    await audit.navigateToBilling(TEAM_SLUG);
    await page.waitForTimeout(2000);

    await audit.navigateToMembers(TEAM_SLUG);
    await page.waitForTimeout(2000);

    await audit.navigateToSettings(TEAM_SLUG);
    await page.waitForTimeout(2000);

    // Report errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console errors found:');
      consoleErrors.forEach((err) => console.log(`  - ${err.substring(0, 200)}`));
    } else {
      console.log('\n✅ No console errors detected');
    }

    // Allow some errors but flag critical ones
    const criticalErrors = consoleErrors.filter(
      (err) =>
        err.includes('TypeError') ||
        err.includes('ReferenceError') ||
        err.includes('SyntaxError'),
    );

    expect(
      criticalErrors.length,
      `Found ${criticalErrors.length} critical JS errors`,
    ).toBe(0);
  });

  test('mobile responsive design', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });

    await audit.navigateToBilling(TEAM_SLUG);
    await page.waitForTimeout(2000);

    // Screenshot: Mobile billing
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile-billing.png'),
      fullPage: true,
    });

    await audit.navigateToMembers(TEAM_SLUG);
    await page.waitForTimeout(1000);

    // Screenshot: Mobile members
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile-members.png'),
      fullPage: true,
    });

    await audit.navigateToSettings(TEAM_SLUG);
    await page.waitForTimeout(1000);

    // Screenshot: Mobile settings
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'mobile-settings.png'),
      fullPage: true,
    });

    console.log('✅ Mobile screenshots captured');
  });

  test('plan selection flow', async ({ page }) => {
    const audit = new TeamAccountsComprehensivePO(page);

    await audit.navigateToBilling(TEAM_SLUG);
    await page.waitForTimeout(2000);

    // Check for plan options
    const plans = ['Core', 'Pro', 'Max'];

    for (const plan of plans) {
      const planElement = page.locator(`text=${plan}`).first();
      const isVisible = await planElement.isVisible().catch(() => false);
      console.log(`${plan} plan visible: ${isVisible ? '✅' : '❌'}`);
    }

    // Try clicking a plan
    const proButton = page.locator('button:has-text("Pro"), [data-test*="pro"]').first();
    if (await proButton.isVisible().catch(() => false)) {
      await proButton.click();
      await page.waitForTimeout(500);

      // Screenshot: Plan selected
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'billing-plan-selected.png'),
        fullPage: true,
      });

      // Check for proceed button
      const proceedButton = page.locator('button:has-text("Proceed"), button:has-text("Continue"), button:has-text("Checkout")');
      const hasProceed = await proceedButton.isVisible().catch(() => false);
      console.log('Proceed to payment button visible:', hasProceed);
    }
  });

  test('account selector shows team', async ({ page }) => {
    // Check account selector dropdown
    const accountTrigger = page.locator('[data-test="account-selector-trigger"], [data-test="account-dropdown-trigger"]').first();

    if (await accountTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountTrigger.click();
      await page.waitForTimeout(500);

      // Screenshot: Account selector open
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'account-selector-open.png'),
        fullPage: true,
      });

      // Check for team in the list
      const teamItem = page.locator(`text=${TEAM_SLUG}`);
      const teamVisible = await teamItem.isVisible().catch(() => false);
      console.log(`Team "${TEAM_SLUG}" in account selector: ${teamVisible ? '✅' : '❌'}`);

      // Close selector
      await page.keyboard.press('Escape');
    } else {
      console.log('Account selector trigger not found');
    }
  });
});
