/**
 * Step 2: Run the full audit AFTER saving auth state
 *
 * Run: npx playwright test full-audit --project=ux-audit
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = path.join(__dirname, 'auth-state.json');
const TEAM_SLUG = 'audit-team';
const screenshotsDir = path.join(__dirname, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Use saved auth state
test.use({
  storageState: AUTH_FILE,
});

interface AuditIssue {
  severity: 'critical' | 'major' | 'minor';
  page: string;
  issue: string;
  details?: string;
}

const issues: AuditIssue[] = [];

function addIssue(severity: AuditIssue['severity'], page: string, issue: string, details?: string) {
  issues.push({ severity, page, issue, details });
  const icon = severity === 'critical' ? '🔴' : severity === 'major' ? '🟠' : '🟡';
  console.log(`${icon} [${severity.toUpperCase()}] ${page}: ${issue}${details ? ` - ${details}` : ''}`);
}

test.describe('Team Account Full UX/UI Audit', () => {

  test('1. Team Dashboard Page Audit', async ({ page }) => {
    console.log('\n📋 AUDITING: Team Dashboard\n');

    await page.goto(`/home/${TEAM_SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '01-team-dashboard.png'),
      fullPage: true,
    });

    const url = page.url();
    console.log('URL:', url);

    // Check if dashboard should even exist for teams
    const hasMRR = await page.locator('text=/MRR/i').isVisible().catch(() => false);
    const hasRevenue = await page.locator('text=/Revenue/i').isVisible().catch(() => false);
    const hasVisitors = await page.locator('text=/Visitors/i').isVisible().catch(() => false);

    if (hasMRR || hasRevenue || hasVisitors) {
      addIssue('major', 'Dashboard', 'Shows MRR/Revenue/Visitors metrics', 'Team dashboard shows SaaS metrics that may not be relevant for team usage');
    }

    // Check for usage display
    const hasUsage = await page.locator('text=/usage/i').isVisible().catch(() => false);
    if (!hasUsage) {
      addIssue('major', 'Dashboard', 'No usage information displayed', 'Team dashboard should show team usage stats');
    }

    // Check sidebar navigation
    const sidebarLinks = {
      'Dashboard': await page.locator('a:has-text("Dashboard")').isVisible().catch(() => false),
      'Settings': await page.locator('a:has-text("Settings")').isVisible().catch(() => false),
      'Members': await page.locator('a:has-text("Members")').isVisible().catch(() => false),
      'Billing': await page.locator('a:has-text("Billing")').isVisible().catch(() => false),
    };

    console.log('Sidebar links found:', sidebarLinks);

    // Check Sparlo design system (left border accent)
    const hasLeftBorder = await page.locator('.border-l-2.border-zinc-900').isVisible().catch(() => false);
    if (!hasLeftBorder) {
      addIssue('minor', 'Dashboard', 'Missing Sparlo design left border accent');
    }
  });

  test('2. Team Members Page Audit', async ({ page }) => {
    console.log('\n📋 AUDITING: Team Members\n');

    await page.goto(`/home/${TEAM_SLUG}/members`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '02-team-members.png'),
      fullPage: true,
    });

    const url = page.url();
    console.log('URL:', url);

    // Check if page loaded correctly
    if (url.includes('404') || url.includes('error')) {
      addIssue('critical', 'Members', 'Page returns 404 or error');
    }

    // Check for members table
    const hasTable = await page.locator('table').isVisible().catch(() => false);
    const hasMembersText = await page.locator('text=/member/i').isVisible().catch(() => false);

    if (!hasTable && !hasMembersText) {
      addIssue('critical', 'Members', 'Members page does not display member list');
    }

    // Check invite button
    const hasInvite = await page.locator('text=/invite/i').isVisible().catch(() => false);
    console.log('Has invite button:', hasInvite);

    // Check Sparlo design
    const hasLeftBorder = await page.locator('.border-l-2.border-zinc-900').isVisible().catch(() => false);
    if (!hasLeftBorder) {
      addIssue('minor', 'Members', 'Missing Sparlo design left border accent');
    }
  });

  test('3. Team Billing Page Audit', async ({ page }) => {
    console.log('\n📋 AUDITING: Team Billing\n');

    await page.goto(`/home/${TEAM_SLUG}/billing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '03-team-billing.png'),
      fullPage: true,
    });

    const url = page.url();
    console.log('URL:', url);

    // Check for usage card (the feature we built)
    const hasUsageCard = await page.locator('text=/usage/i').first().isVisible().catch(() => false);
    const hasPercentage = await page.locator('text=/%/').first().isVisible().catch(() => false);
    const hasTokens = await page.locator('text=/tokens/i').first().isVisible().catch(() => false);

    console.log('Usage card elements:', { hasUsageCard, hasPercentage, hasTokens });

    if (!hasUsageCard) {
      addIssue('major', 'Billing', 'Usage card not visible');
    }

    // Check for member breakdown
    const hasMemberBreakdown = await page.locator('text=/team member|by member/i').isVisible().catch(() => false);
    if (!hasMemberBreakdown) {
      addIssue('major', 'Billing', 'Member usage breakdown not visible');
    }

    // Check pricing display (the $19,900 bug)
    const priceTexts = await page.locator('text=/\\$[0-9,]+/').allTextContents();
    console.log('Prices found:', priceTexts);

    for (const price of priceTexts) {
      const numericPrice = parseFloat(price.replace(/[$,]/g, ''));
      if (numericPrice > 10000) {
        addIssue('critical', 'Billing', 'Prices displayed in cents not dollars', `Found: ${price}`);
        break;
      }
    }

    // Check if billing should link to Stripe
    const hasStripeLink = await page.locator('a[href*="stripe"], a[href*="billing.stripe"]').isVisible().catch(() => false);
    const hasPlanSelector = await page.locator('text=/choose a plan|manage.*plan/i').isVisible().catch(() => false);

    if (hasPlanSelector && !hasStripeLink) {
      addIssue('major', 'Billing', 'Plan selector shown but may not link to Stripe properly');
    }

    // Check Sparlo design
    const hasLeftBorder = await page.locator('.border-l-2.border-zinc-900').isVisible().catch(() => false);
    if (!hasLeftBorder) {
      addIssue('minor', 'Billing', 'Missing Sparlo design left border accent');
    }
  });

  test('4. Team Settings Page Audit', async ({ page }) => {
    console.log('\n📋 AUDITING: Team Settings\n');

    await page.goto(`/home/${TEAM_SLUG}/settings`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: path.join(screenshotsDir, '04-team-settings.png'),
      fullPage: true,
    });

    const url = page.url();
    console.log('URL:', url);

    // Check for settings form
    const hasNameInput = await page.locator('input[name="name"], input[placeholder*="name"]').isVisible().catch(() => false);
    if (!hasNameInput) {
      addIssue('major', 'Settings', 'Team name input not visible');
    }

    // Check for danger zone
    const hasDangerZone = await page.locator('text=/danger|delete/i').isVisible().catch(() => false);
    console.log('Has danger zone:', hasDangerZone);

    // Check Sparlo design
    const hasLeftBorder = await page.locator('.border-l-2.border-zinc-900').isVisible().catch(() => false);
    if (!hasLeftBorder) {
      addIssue('minor', 'Settings', 'Missing Sparlo design left border accent');
    }
  });

  test('5. Navigation & Links Audit', async ({ page }) => {
    console.log('\n📋 AUDITING: Navigation & Links\n');

    await page.goto(`/home/${TEAM_SLUG}`);
    await page.waitForLoadState('networkidle');

    // Test each sidebar link
    const linksToTest = [
      { name: 'Members', expectedUrl: `/home/${TEAM_SLUG}/members` },
      { name: 'Settings', expectedUrl: `/home/${TEAM_SLUG}/settings` },
      { name: 'Billing', expectedUrl: `/home/${TEAM_SLUG}/billing` },
    ];

    for (const link of linksToTest) {
      const linkElement = page.locator(`a:has-text("${link.name}")`).first();
      const href = await linkElement.getAttribute('href').catch(() => null);

      console.log(`Link "${link.name}": href="${href}"`);

      if (!href) {
        addIssue('critical', 'Navigation', `${link.name} link not found or has no href`);
      } else if (!href.includes(link.expectedUrl) && !href.includes(TEAM_SLUG)) {
        addIssue('major', 'Navigation', `${link.name} link may be incorrect`, `Found: ${href}, Expected: ${link.expectedUrl}`);
      }

      // Actually click and verify navigation
      try {
        await linkElement.click();
        await page.waitForLoadState('networkidle');
        const actualUrl = page.url();

        if (!actualUrl.includes(TEAM_SLUG)) {
          addIssue('critical', 'Navigation', `${link.name} link navigates to wrong page`, `Ended up at: ${actualUrl}`);
        }

        // Go back to dashboard for next test
        await page.goto(`/home/${TEAM_SLUG}`);
        await page.waitForLoadState('networkidle');
      } catch (e) {
        addIssue('critical', 'Navigation', `${link.name} link click failed`, String(e));
      }
    }
  });

  test('6. Console Errors Check', async ({ page }) => {
    console.log('\n📋 AUDITING: Console Errors\n');

    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Visit all team pages
    const pages = [
      `/home/${TEAM_SLUG}`,
      `/home/${TEAM_SLUG}/members`,
      `/home/${TEAM_SLUG}/billing`,
      `/home/${TEAM_SLUG}/settings`,
    ];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    if (consoleErrors.length > 0) {
      console.log('Console errors found:', consoleErrors);
      for (const error of consoleErrors.slice(0, 5)) {
        addIssue('major', 'Console', 'JavaScript error detected', error.substring(0, 100));
      }
    } else {
      console.log('✅ No console errors detected');
    }
  });

  test.afterAll(async () => {
    console.log('\n========================================');
    console.log('AUDIT SUMMARY');
    console.log('========================================\n');

    const critical = issues.filter(i => i.severity === 'critical');
    const major = issues.filter(i => i.severity === 'major');
    const minor = issues.filter(i => i.severity === 'minor');

    console.log(`🔴 Critical: ${critical.length}`);
    console.log(`🟠 Major: ${major.length}`);
    console.log(`🟡 Minor: ${minor.length}`);
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);

    // Write report to file
    const report = {
      timestamp: new Date().toISOString(),
      teamSlug: TEAM_SLUG,
      summary: {
        critical: critical.length,
        major: major.length,
        minor: minor.length,
      },
      issues,
    };

    fs.writeFileSync(
      path.join(screenshotsDir, 'audit-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📋 Full report saved to: audit-report.json\n');

    if (critical.length > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      critical.forEach(i => console.log(`  - ${i.page}: ${i.issue}`));
    }

    if (major.length > 0) {
      console.log('\n🟠 MAJOR ISSUES:');
      major.forEach(i => console.log(`  - ${i.page}: ${i.issue}`));
    }
  });
});
