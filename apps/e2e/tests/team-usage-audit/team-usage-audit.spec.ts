/**
 * Team Usage Feature - Comprehensive UX/UI Audit
 *
 * This test suite performs a full audit of the team accounts functionality
 * with focus on the team usage display feature.
 *
 * Run with:
 *   AUDIT_BASE_URL=https://sparlo.ai npx playwright test team-usage-audit --project=chromium
 *
 * Or for local:
 *   npx playwright test team-usage-audit --project=chromium
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

import { TeamUsageAuditPageObject } from './team-usage-audit.po';

// Test credentials - can be overridden via environment variables
const TEST_EMAIL = process.env.AUDIT_EMAIL || 'swimakaswim@gmail.com';
const TEST_PASSWORD = process.env.AUDIT_PASSWORD || 'Linguine2025';

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('Team Usage UX/UI Audit', () => {
  let audit: TeamUsageAuditPageObject;

  test.beforeEach(async ({ page }) => {
    // Use custom base URL if provided
    const baseUrl = process.env.AUDIT_BASE_URL;
    if (baseUrl) {
      await page.goto(baseUrl);
    }

    audit = new TeamUsageAuditPageObject(page);
  });

  test('Complete UX/UI Audit Flow', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for full audit

    console.log('\n========================================');
    console.log('TEAM USAGE UX/UI AUDIT');
    console.log('========================================\n');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Base URL: ${process.env.AUDIT_BASE_URL || 'http://localhost:3000'}`);
    console.log('\n');

    // Step 1: Login
    console.log('📋 Step 1: Login');
    await audit.login(TEST_EMAIL, TEST_PASSWORD);

    // Step 2: Create or navigate to team
    console.log('\n📋 Step 2: Navigate to team account');
    await audit.createOrNavigateToTeam();

    // Step 3: Audit Team Dashboard
    console.log('\n📋 Step 3: Audit Team Dashboard');
    await audit.auditTeamDashboard();

    // Step 4: Audit Team Billing (PRIMARY FOCUS)
    console.log('\n📋 Step 4: Audit Team Billing (PRIMARY FOCUS)');
    await audit.auditTeamBilling();

    // Step 5: Audit Team Members
    console.log('\n📋 Step 5: Audit Team Members');
    await audit.auditTeamMembers();

    // Step 6: Audit Team Settings
    console.log('\n📋 Step 6: Audit Team Settings');
    await audit.auditTeamSettings();

    // Step 7: Audit Navigation
    console.log('\n📋 Step 7: Audit Navigation');
    await audit.auditNavigation();

    // Step 8: Audit Responsiveness
    console.log('\n📋 Step 8: Audit Responsiveness');
    await audit.auditResponsiveness();

    // Step 9: Test Button Interactions
    console.log('\n📋 Step 9: Test Button Interactions');
    await audit.clickAllButtons();

    // Generate report
    const report = audit.generateReport();

    // Save report
    const reportPath = path.join(__dirname, 'audit-report.md');
    fs.writeFileSync(reportPath, report);

    console.log('\n========================================');
    console.log('AUDIT COMPLETE');
    console.log('========================================');
    console.log(`Report saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${screenshotsDir}`);

    // Print summary
    const passCount = audit.results.filter((r) => r.status === 'pass').length;
    const failCount = audit.results.filter((r) => r.status === 'fail').length;
    const warnCount = audit.results.filter((r) => r.status === 'warning').length;

    console.log(`\n✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`⚠️  Warnings: ${warnCount}`);
    console.log(`🔴 Console Errors: ${audit.consoleErrors.length}`);

    // Print console errors if any
    if (audit.consoleErrors.length > 0) {
      console.log('\n🔴 Console Errors Found:');
      for (const error of audit.consoleErrors) {
        console.log(`  - [${error.type}] ${error.message.substring(0, 100)}...`);
      }
    }

    // Fail test if there are critical failures
    expect(failCount).toBeLessThan(3); // Allow up to 2 failures before failing the test
  });

  test('Team Billing Page - Detailed Audit', async ({ page }) => {
    test.setTimeout(120000);

    audit = new TeamUsageAuditPageObject(page);

    // Login and navigate
    await audit.login(TEST_EMAIL, TEST_PASSWORD);
    await audit.createOrNavigateToTeam();

    // Navigate to billing
    await page.goto(`/home/${audit.teamSlug}/billing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Extra wait for data

    // Detailed billing page checks
    console.log('\n📋 Detailed Billing Page Audit\n');

    // Check for AuraUsageCard component elements
    const checks = [
      { selector: 'text=/monthly limit/i', name: 'Monthly limit text' },
      { selector: 'text=/%/', name: 'Percentage display' },
      { selector: '[class*="progress"], [role="progressbar"]', name: 'Progress bar' },
      { selector: 'text=/tokens/i', name: 'Tokens text' },
      { selector: 'text=/period/i', name: 'Period text' },
      { selector: 'text=/team member/i', name: 'Team member section' },
      { selector: 'text=/report/i', name: 'Report count' },
    ];

    for (const check of checks) {
      const visible = await page
        .locator(check.selector)
        .first()
        .isVisible()
        .catch(() => false);

      console.log(`${visible ? '✅' : '❌'} ${check.name}`);
    }

    // Take a detailed screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, 'billing-detailed.png'),
      fullPage: true,
    });

    // Get all visible text on the page for debugging
    const pageText = await page.locator('body').innerText();
    console.log('\n📄 Page contains usage-related text:', pageText.includes('usage') || pageText.includes('Usage'));
    console.log('📄 Page contains member-related text:', pageText.includes('member') || pageText.includes('Member'));
  });
});
