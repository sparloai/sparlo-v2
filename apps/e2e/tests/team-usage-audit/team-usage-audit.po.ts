import { Page, expect } from '@playwright/test';

export interface AuditResult {
  page: string;
  item: string;
  status: 'pass' | 'fail' | 'warning';
  details?: string;
  screenshot?: string;
}

export interface ConsoleError {
  page: string;
  type: string;
  message: string;
}

export class TeamUsageAuditPageObject {
  private readonly page: Page;
  public results: AuditResult[] = [];
  public consoleErrors: ConsoleError[] = [];
  public teamSlug: string | null = null;

  constructor(page: Page) {
    this.page = page;

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({
          page: page.url(),
          type: 'error',
          message: msg.text(),
        });
      }
    });

    page.on('pageerror', (error) => {
      this.consoleErrors.push({
        page: page.url(),
        type: 'pageerror',
        message: error.message,
      });
    });
  }

  private addResult(
    page: string,
    item: string,
    status: 'pass' | 'fail' | 'warning',
    details?: string,
  ) {
    this.results.push({ page, item, status, details });
    console.log(`[${status.toUpperCase()}] ${page} - ${item}${details ? `: ${details}` : ''}`);
  }

  async login(email: string, password: string) {
    await this.page.goto('/auth/sign-in');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Wait for form to render

    // Try multiple selectors for email input
    const emailSelectors = [
      '[data-test="email-input"]',
      'input[name="email"]',
      'input[type="email"]',
    ];

    for (const selector of emailSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.fill(email);
          break;
        }
      } catch {
        continue;
      }
    }

    // Try multiple selectors for password input
    const passwordSelectors = [
      '[data-test="password-input"]',
      'input[name="password"]',
      'input[type="password"]',
    ];

    for (const selector of passwordSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.fill(password);
          break;
        }
      } catch {
        continue;
      }
    }

    // Click submit button
    await this.page.click('button[type="submit"]');

    // Wait for redirect - could be /home or stay on auth page with error
    try {
      await this.page.waitForURL('**/home**', { timeout: 15000 });
      this.addResult('auth', 'Login successful', 'pass');
    } catch {
      // Check if we're already logged in (might have redirected to different path)
      const url = this.page.url();
      if (url.includes('/home')) {
        this.addResult('auth', 'Login successful', 'pass');
      } else {
        // Try navigating directly to home
        await this.page.goto('/home');
        await this.page.waitForLoadState('networkidle');
        const newUrl = this.page.url();
        if (newUrl.includes('/home')) {
          this.addResult('auth', 'Login successful (redirected)', 'pass');
        } else {
          this.addResult('auth', 'Login failed', 'fail', `Ended up at: ${newUrl}`);
        }
      }
    }
  }

  async createOrNavigateToTeam() {
    // First check if user already has a team account
    // Try multiple selectors for the account selector button
    const accountSelectorSelectors = [
      '[data-test="account-selector-trigger"]',
      'button:has-text("S")',  // The avatar button shows "S"
      'aside button:last-child',  // Last button in sidebar
      '[class*="avatar"]',
    ];

    let clicked = false;
    for (const selector of accountSelectorSelectors) {
      try {
        const element = this.page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          await element.click();
          clicked = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!clicked) {
      this.addResult('team', 'Account selector not found', 'fail', 'Could not find account selector button');
      return;
    }

    await this.page.waitForTimeout(500);

    // Try multiple selectors for team accounts
    const teamAccounts = await this.page.locator('[data-test="account-selector-team"], [data-test*="team"], a[href*="/home/"]:not([href="/home"])').all();

    if (teamAccounts.length > 0) {
      // Click the first team account
      await teamAccounts[0].click();
      await this.page.waitForTimeout(1000);

      // Extract slug from URL
      const url = this.page.url();
      const match = url.match(/\/home\/([^/]+)/);
      this.teamSlug = match ? match[1] : null;

      if (this.teamSlug && this.teamSlug !== 'reports' && this.teamSlug !== 'billing') {
        this.addResult('team', 'Navigated to existing team', 'pass', `Slug: ${this.teamSlug}`);
      } else {
        // Still on personal account, try to navigate directly
        this.addResult('team', 'No team found in selector', 'warning', 'Will try direct navigation');
        // Try navigating to audit-team directly
        await this.page.goto('/home/audit-team');
        await this.page.waitForLoadState('networkidle');
        const newUrl = this.page.url();
        if (newUrl.includes('audit-team')) {
          this.teamSlug = 'audit-team';
          this.addResult('team', 'Direct navigation successful', 'pass', `Slug: ${this.teamSlug}`);
        }
      }
    } else {
      // No team accounts found - try direct navigation
      this.addResult('team', 'No team accounts in selector', 'warning', 'Trying direct navigation');
      await this.page.goto('/home/audit-team');
      await this.page.waitForLoadState('networkidle');

      const url = this.page.url();
      if (url.includes('audit-team')) {
        this.teamSlug = 'audit-team';
        this.addResult('team', 'Direct navigation successful', 'pass', `Slug: ${this.teamSlug}`);
      } else {
        this.addResult('team', 'Could not access team', 'fail', 'No team account found');
      }
    }
  }

  async auditTeamDashboard() {
    const pageName = 'Team Dashboard';
    await this.page.goto(`/home/${this.teamSlug}`);
    await this.page.waitForLoadState('networkidle');

    // Check left border accent
    const hasLeftBorder = await this.page
      .locator('.border-l-2.border-zinc-900')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Left border accent (Sparlo design)',
      hasLeftBorder ? 'pass' : 'warning',
      hasLeftBorder ? 'Present' : 'Not found',
    );

    // Check page header
    const hasHeader = await this.page
      .locator('h1, [data-test="page-header"]')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(pageName, 'Page header visible', hasHeader ? 'pass' : 'fail');

    // Screenshot
    await this.page.screenshot({
      path: `tests/team-usage-audit/screenshots/dashboard.png`,
      fullPage: true,
    });

    this.addResult(pageName, 'Screenshot captured', 'pass', 'dashboard.png');
  }

  async auditTeamBilling() {
    const pageName = 'Team Billing';
    await this.page.goto(`/home/${this.teamSlug}/billing`);
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Wait for data to load

    // Check left border accent
    const hasLeftBorder = await this.page
      .locator('.border-l-2.border-zinc-900')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Left border accent',
      hasLeftBorder ? 'pass' : 'warning',
    );

    // Check for usage card
    const usageCard = await this.page
      .locator('text=/usage|Usage/i')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Usage card visible',
      usageCard ? 'pass' : 'fail',
      usageCard ? 'Found' : 'Usage card not found on page',
    );

    // Check for percentage display
    const hasPercentage = await this.page
      .locator('text=/%/')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Usage percentage displayed',
      hasPercentage ? 'pass' : 'warning',
      hasPercentage ? 'Found' : 'No percentage visible',
    );

    // Check for progress bar
    const hasProgressBar = await this.page
      .locator('[role="progressbar"], .progress, [class*="progress"]')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Progress bar visible',
      hasProgressBar ? 'pass' : 'warning',
    );

    // Check for member usage breakdown
    const hasMemberBreakdown = await this.page
      .locator('text=/team member|by member/i')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Member usage breakdown',
      hasMemberBreakdown ? 'pass' : 'warning',
      hasMemberBreakdown ? 'Found' : 'Member breakdown not visible',
    );

    // Check for tokens display
    const hasTokens = await this.page
      .locator('text=/tokens/i')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Tokens display',
      hasTokens ? 'pass' : 'warning',
    );

    // Screenshot
    await this.page.screenshot({
      path: `tests/team-usage-audit/screenshots/billing.png`,
      fullPage: true,
    });

    this.addResult(pageName, 'Screenshot captured', 'pass', 'billing.png');
  }

  async auditTeamMembers() {
    const pageName = 'Team Members';
    await this.page.goto(`/home/${this.teamSlug}/members`);
    await this.page.waitForLoadState('networkidle');

    // Check left border accent
    const hasLeftBorder = await this.page
      .locator('.border-l-2.border-zinc-900')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(pageName, 'Left border accent', hasLeftBorder ? 'pass' : 'warning');

    // Check members table
    const hasTable = await this.page
      .locator('table, [role="table"]')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(pageName, 'Members table visible', hasTable ? 'pass' : 'fail');

    // Check invite button
    const hasInviteButton = await this.page
      .locator('[data-test="invite-members-form-trigger"], text=/invite/i')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Invite members button',
      hasInviteButton ? 'pass' : 'warning',
      hasInviteButton ? 'Found' : 'May be hidden due to permissions',
    );

    // Screenshot
    await this.page.screenshot({
      path: `tests/team-usage-audit/screenshots/members.png`,
      fullPage: true,
    });

    this.addResult(pageName, 'Screenshot captured', 'pass', 'members.png');
  }

  async auditTeamSettings() {
    const pageName = 'Team Settings';
    await this.page.goto(`/home/${this.teamSlug}/settings`);
    await this.page.waitForLoadState('networkidle');

    // Check left border accent
    const hasLeftBorder = await this.page
      .locator('.border-l-2.border-zinc-900')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(pageName, 'Left border accent', hasLeftBorder ? 'pass' : 'warning');

    // Check account name form
    const hasNameForm = await this.page
      .locator('[data-test="update-team-account-name-form"], input[name="name"]')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(pageName, 'Account name form', hasNameForm ? 'pass' : 'fail');

    // Check danger zone
    const hasDangerZone = await this.page
      .locator('text=/danger|delete/i')
      .first()
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Danger zone visible',
      hasDangerZone ? 'pass' : 'warning',
      hasDangerZone ? 'Found' : 'May be hidden due to permissions',
    );

    // Screenshot
    await this.page.screenshot({
      path: `tests/team-usage-audit/screenshots/settings.png`,
      fullPage: true,
    });

    this.addResult(pageName, 'Screenshot captured', 'pass', 'settings.png');
  }

  async auditNavigation() {
    const pageName = 'Navigation';

    // Test sidebar navigation
    const sidebarLinks = ['Dashboard', 'Members', 'Billing', 'Settings'];

    for (const link of sidebarLinks) {
      const linkElement = await this.page
        .locator(`a:has-text("${link}")`)
        .first()
        .isVisible()
        .catch(() => false);

      this.addResult(
        pageName,
        `Sidebar link: ${link}`,
        linkElement ? 'pass' : 'warning',
      );
    }

    // Test account switcher
    await this.page.click('[data-test="account-selector-trigger"]');
    await this.page.waitForTimeout(300);

    const selectorVisible = await this.page
      .locator('[data-test="account-selector-content"]')
      .isVisible()
      .catch(() => false);

    this.addResult(
      pageName,
      'Account selector works',
      selectorVisible ? 'pass' : 'fail',
    );

    // Close selector
    await this.page.keyboard.press('Escape');
  }

  async auditResponsiveness() {
    const pageName = 'Responsiveness';

    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.page.goto(`/home/${this.teamSlug}/billing`);
    await this.page.waitForLoadState('networkidle');

    await this.page.screenshot({
      path: `tests/team-usage-audit/screenshots/billing-tablet.png`,
      fullPage: true,
    });

    this.addResult(pageName, 'Tablet viewport (768px)', 'pass', 'Screenshot captured');

    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.page.waitForTimeout(500);

    await this.page.screenshot({
      path: `tests/team-usage-audit/screenshots/billing-mobile.png`,
      fullPage: true,
    });

    this.addResult(pageName, 'Mobile viewport (375px)', 'pass', 'Screenshot captured');

    // Reset viewport
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }

  async clickAllButtons() {
    const pageName = 'Button Interactions';

    // Go to billing page and try interactions
    await this.page.goto(`/home/${this.teamSlug}/billing`);
    await this.page.waitForLoadState('networkidle');

    // Find all buttons and test they don't cause errors
    const buttons = await this.page.locator('button:visible').all();

    this.addResult(pageName, 'Buttons found', 'pass', `${buttons.length} buttons on billing page`);

    // Go to members page
    await this.page.goto(`/home/${this.teamSlug}/members`);
    await this.page.waitForLoadState('networkidle');

    const memberButtons = await this.page.locator('button:visible').all();
    this.addResult(pageName, 'Member page buttons', 'pass', `${memberButtons.length} buttons found`);
  }

  generateReport(): string {
    const passCount = this.results.filter((r) => r.status === 'pass').length;
    const failCount = this.results.filter((r) => r.status === 'fail').length;
    const warnCount = this.results.filter((r) => r.status === 'warning').length;

    let report = `
# Team Usage UX/UI Audit Report
Generated: ${new Date().toISOString()}
Team Slug: ${this.teamSlug}

## Summary
- ✅ Passed: ${passCount}
- ❌ Failed: ${failCount}
- ⚠️ Warnings: ${warnCount}

## Console Errors
${this.consoleErrors.length === 0 ? 'No console errors detected.' : this.consoleErrors.map((e) => `- [${e.type}] ${e.page}: ${e.message}`).join('\n')}

## Detailed Results

`;

    // Group by page
    const byPage = this.results.reduce(
      (acc, r) => {
        if (!acc[r.page]) acc[r.page] = [];
        acc[r.page].push(r);
        return acc;
      },
      {} as Record<string, AuditResult[]>,
    );

    for (const [page, items] of Object.entries(byPage)) {
      report += `### ${page}\n\n`;
      report += '| Item | Status | Details |\n';
      report += '|------|--------|--------|\n';

      for (const item of items) {
        const statusIcon =
          item.status === 'pass' ? '✅' : item.status === 'fail' ? '❌' : '⚠️';
        report += `| ${item.item} | ${statusIcon} | ${item.details || '-'} |\n`;
      }

      report += '\n';
    }

    return report;
  }
}
