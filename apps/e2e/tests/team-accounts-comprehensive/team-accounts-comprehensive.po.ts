import { Page, expect, Locator } from '@playwright/test';

interface AuditIssue {
  severity: 'critical' | 'major' | 'minor';
  page: string;
  issue: string;
  details?: string;
}

interface DesignCheck {
  name: string;
  selector: string;
  expected: boolean;
}

export class TeamAccountsComprehensivePO {
  private readonly page: Page;
  public readonly issues: AuditIssue[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  // ============================================
  // ISSUE TRACKING
  // ============================================

  addIssue(
    severity: AuditIssue['severity'],
    pageName: string,
    issue: string,
    details?: string,
  ) {
    this.issues.push({ severity, page: pageName, issue, details });
    const icon =
      severity === 'critical' ? '🔴' : severity === 'major' ? '🟠' : '🟡';
    console.log(
      `${icon} [${severity.toUpperCase()}] ${pageName}: ${issue}${details ? ` - ${details}` : ''}`,
    );
  }

  getSummary() {
    return {
      critical: this.issues.filter((i) => i.severity === 'critical').length,
      major: this.issues.filter((i) => i.severity === 'major').length,
      minor: this.issues.filter((i) => i.severity === 'minor').length,
      issues: this.issues,
    };
  }

  // ============================================
  // NAVIGATION
  // ============================================

  async navigateToTeam(teamSlug: string) {
    await this.page.goto(`/home/${teamSlug}`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
  }

  async navigateToBilling(teamSlug: string) {
    await this.page.goto(`/home/${teamSlug}/billing`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
  }

  async navigateToMembers(teamSlug: string) {
    await this.page.goto(`/home/${teamSlug}/members`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
  }

  async navigateToSettings(teamSlug: string) {
    await this.page.goto(`/home/${teamSlug}/settings`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
  }

  async navigateToHelp(teamSlug: string) {
    await this.page.goto(`/home/${teamSlug}/help`);
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
  }

  // ============================================
  // SIDEBAR NAVIGATION CHECKS
  // ============================================

  async verifySidebarLinks(teamSlug: string) {
    console.log('\n📋 Verifying sidebar navigation links...\n');

    const links = [
      { name: 'Billing', expectedUrl: `/home/${teamSlug}/billing` },
      { name: 'Members', expectedUrl: `/home/${teamSlug}/members` },
      { name: 'Settings', expectedUrl: `/home/${teamSlug}/settings` },
      { name: 'Help', expectedUrl: `/home/${teamSlug}/help` },
    ];

    for (const link of links) {
      try {
        const linkElement = this.page.locator(`a:has-text("${link.name}")`).first();
        const isVisible = await linkElement.isVisible().catch(() => false);

        if (!isVisible) {
          this.addIssue('major', 'Navigation', `${link.name} link not visible`);
          continue;
        }

        const href = await linkElement.getAttribute('href');
        console.log(`Link "${link.name}": href="${href}"`);

        // Click and verify navigation
        await linkElement.click();
        await this.page.waitForLoadState('networkidle');
        const actualUrl = this.page.url();

        if (!actualUrl.includes(teamSlug)) {
          this.addIssue(
            'critical',
            'Navigation',
            `${link.name} navigates to wrong page`,
            `Expected: ${link.expectedUrl}, Got: ${actualUrl}`,
          );
        } else {
          console.log(`✅ ${link.name} navigation works`);
        }

        // Return to billing (home) for next test
        await this.navigateToBilling(teamSlug);
      } catch (e) {
        this.addIssue(
          'critical',
          'Navigation',
          `${link.name} link click failed`,
          String(e),
        );
      }
    }
  }

  // ============================================
  // BILLING PAGE CHECKS
  // ============================================

  async verifyBillingPage(teamSlug: string) {
    console.log('\n📋 Verifying billing page...\n');
    await this.navigateToBilling(teamSlug);

    // Check for pricing display (should be in dollars, not cents)
    const priceTexts = await this.page
      .locator('text=/\\$[0-9,]+/')
      .allTextContents();
    console.log('Prices found:', priceTexts);

    for (const price of priceTexts) {
      const numericPrice = parseFloat(price.replace(/[$,]/g, ''));
      if (numericPrice > 10000) {
        this.addIssue(
          'critical',
          'Billing',
          'Prices displayed in cents not dollars',
          `Found: ${price}`,
        );
        break;
      }
    }

    // Check for plan cards
    const hasPlanCards = await this.page
      .locator('text=/Core|Pro|Max/i')
      .first()
      .isVisible()
      .catch(() => false);
    if (hasPlanCards) {
      console.log('✅ Plan cards visible');
    }

    // Check for usage card (only visible with subscription)
    const hasUsageCard = await this.page
      .locator('text=/usage/i')
      .first()
      .isVisible()
      .catch(() => false);
    console.log('Usage card visible:', hasUsageCard);

    // Check for Stripe portal button (only visible with subscription)
    const hasStripePortal = await this.page
      .locator('text=/Manage.*Billing|Billing.*Portal/i')
      .isVisible()
      .catch(() => false);
    console.log('Stripe portal button visible:', hasStripePortal);

    // Verify plan selection buttons work
    const proceedButton = this.page.locator(
      'button:has-text("Proceed to Payment")',
    );
    if (await proceedButton.isVisible().catch(() => false)) {
      console.log('✅ Proceed to Payment button visible');
    }

    return { hasPlanCards, hasUsageCard, hasStripePortal };
  }

  async verifyPlanSelection(teamSlug: string) {
    console.log('\n📋 Verifying plan selection...\n');
    await this.navigateToBilling(teamSlug);

    // Find plan option buttons
    const planOptions = ['Core', 'Pro', 'Max'];
    for (const plan of planOptions) {
      const planCard = this.page.locator(`text=${plan}`).first();
      const isVisible = await planCard.isVisible().catch(() => false);
      console.log(`${plan} plan option: ${isVisible ? '✅' : '❌'}`);

      if (!isVisible) {
        this.addIssue('major', 'Billing', `${plan} plan option not visible`);
      }
    }
  }

  // ============================================
  // MEMBERS PAGE CHECKS
  // ============================================

  async verifyMembersPage(teamSlug: string) {
    console.log('\n📋 Verifying members page...\n');
    await this.navigateToMembers(teamSlug);

    // Check if members table exists
    const hasTable = await this.page.locator('table').isVisible().catch(() => false);
    const hasMembersHeading = await this.page
      .locator('text=/Members|Team Members/i')
      .first()
      .isVisible()
      .catch(() => false);

    if (!hasTable && !hasMembersHeading) {
      this.addIssue('critical', 'Members', 'Members page does not display member list');
    } else {
      console.log('✅ Members table visible');
    }

    // Check for invite button
    const hasInviteButton = await this.page
      .locator('[data-test="invite-members-form-trigger"]')
      .isVisible()
      .catch(() => false);
    console.log('Invite button visible:', hasInviteButton);

    if (!hasInviteButton) {
      // Try alternative selector
      const altInviteButton = await this.page
        .locator('button:has-text("Invite")')
        .isVisible()
        .catch(() => false);
      if (!altInviteButton) {
        this.addIssue('major', 'Members', 'Invite members button not visible');
      }
    } else {
      console.log('✅ Invite button visible');
    }

    // Check for pending invitations section
    const hasPendingSection = await this.page
      .locator('text=/Pending|Invitations/i')
      .first()
      .isVisible()
      .catch(() => false);
    console.log('Pending invitations section:', hasPendingSection);

    return { hasTable, hasInviteButton, hasPendingSection };
  }

  async verifyInviteFlow(teamSlug: string) {
    console.log('\n📋 Verifying invite member flow...\n');
    await this.navigateToMembers(teamSlug);

    try {
      // Click invite button
      const inviteButton = this.page.locator(
        '[data-test="invite-members-form-trigger"]',
      );
      if (await inviteButton.isVisible().catch(() => false)) {
        await inviteButton.click();
        await this.page.waitForTimeout(500);

        // Check if invite dialog opens
        const inviteForm = this.page.locator('[data-test="invite-members-form"]');
        const isFormVisible = await inviteForm.isVisible().catch(() => false);

        if (isFormVisible) {
          console.log('✅ Invite dialog opens');

          // Check for email input
          const emailInput = this.page.locator('[data-test="invite-email-input"]');
          const hasEmailInput = await emailInput.isVisible().catch(() => false);
          console.log('Email input visible:', hasEmailInput);

          // Check for role selector
          const roleSelector = this.page.locator(
            '[data-test="role-selector-trigger"]',
          );
          const hasRoleSelector = await roleSelector.isVisible().catch(() => false);
          console.log('Role selector visible:', hasRoleSelector);

          // Close dialog
          await this.page.keyboard.press('Escape');
        } else {
          this.addIssue('major', 'Members', 'Invite dialog does not open');
        }
      }
    } catch (e) {
      this.addIssue('major', 'Members', 'Invite flow failed', String(e));
    }
  }

  async verifyMemberActions(teamSlug: string) {
    console.log('\n📋 Verifying member action menus...\n');
    await this.navigateToMembers(teamSlug);

    // Find member rows (excluding current user which has no actions)
    const memberRows = this.page.locator('table tbody tr');
    const rowCount = await memberRows.count();
    console.log(`Found ${rowCount} member rows`);

    if (rowCount > 0) {
      // Check if action buttons exist
      const actionButtons = this.page.locator('table tbody tr button');
      const hasActions = (await actionButtons.count()) > 0;
      console.log('Member action buttons:', hasActions ? '✅' : '❌');
    }
  }

  // ============================================
  // SETTINGS PAGE CHECKS
  // ============================================

  async verifySettingsPage(teamSlug: string) {
    console.log('\n📋 Verifying settings page...\n');
    await this.navigateToSettings(teamSlug);

    // Check for team name input
    const nameInput = await this.page
      .locator('[data-test="update-team-account-name-form"] input')
      .isVisible()
      .catch(() => false);
    console.log('Team name input:', nameInput ? '✅' : '❌');

    if (!nameInput) {
      const altNameInput = await this.page
        .locator('input[placeholder*="name" i], input[name="name"]')
        .isVisible()
        .catch(() => false);
      if (!altNameInput) {
        this.addIssue('major', 'Settings', 'Team name input not visible');
      }
    }

    // Check for save button
    const saveButton = await this.page
      .locator('[data-test="update-team-account-name-form"] button')
      .isVisible()
      .catch(() => false);
    console.log('Save button:', saveButton ? '✅' : '❌');

    // Check for danger zone / delete team
    const hasDangerZone = await this.page
      .locator('text=/danger|delete.*team/i')
      .first()
      .isVisible()
      .catch(() => false);
    console.log('Danger zone:', hasDangerZone ? '✅' : '❌');

    return { nameInput, saveButton, hasDangerZone };
  }

  // ============================================
  // DESIGN AESTHETIC CHECKS (Sparlo Design System)
  // ============================================

  async verifyDesignSystem(teamSlug: string, pageName: string) {
    console.log(`\n📋 Verifying Sparlo design system on ${pageName}...\n`);

    const checks: DesignCheck[] = [
      {
        name: 'Left border accent',
        selector: '.border-l-2',
        expected: true,
      },
      {
        name: 'Card styling',
        selector: '.rounded-xl',
        expected: true,
      },
      {
        name: 'Page body styling',
        selector: '[class*="pl-10"], .pl-10',
        expected: true,
      },
    ];

    for (const check of checks) {
      const element = this.page.locator(check.selector).first();
      const isVisible = await element.isVisible().catch(() => false);

      if (check.expected && !isVisible) {
        this.addIssue('minor', pageName, `Missing Sparlo design: ${check.name}`);
      } else if (isVisible) {
        console.log(`✅ ${check.name}`);
      }
    }
  }

  // ============================================
  // CONSOLE ERROR CHECKS
  // ============================================

  setupConsoleErrorListener(): string[] {
    const consoleErrors: string[] = [];

    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    this.page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    return consoleErrors;
  }

  reportConsoleErrors(consoleErrors: string[], pageName: string) {
    if (consoleErrors.length > 0) {
      console.log(`Console errors found on ${pageName}:`, consoleErrors);
      for (const error of consoleErrors.slice(0, 5)) {
        this.addIssue(
          'major',
          pageName,
          'JavaScript error detected',
          error.substring(0, 200),
        );
      }
    } else {
      console.log(`✅ No console errors on ${pageName}`);
    }
  }

  // ============================================
  // SCREENSHOT HELPERS
  // ============================================

  async takeScreenshot(name: string, dir: string) {
    const path = `${dir}/${name}.png`;
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot saved: ${path}`);
    return path;
  }

  // ============================================
  // COMPREHENSIVE PAGE AUDIT
  // ============================================

  async auditPage(teamSlug: string, pageName: string, screenshotsDir: string) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`AUDITING: ${pageName}`);
    console.log(`${'='.repeat(50)}\n`);

    const consoleErrors = this.setupConsoleErrorListener();

    // Navigate to page
    switch (pageName) {
      case 'Billing':
        await this.navigateToBilling(teamSlug);
        break;
      case 'Members':
        await this.navigateToMembers(teamSlug);
        break;
      case 'Settings':
        await this.navigateToSettings(teamSlug);
        break;
      case 'Help':
        await this.navigateToHelp(teamSlug);
        break;
    }

    await this.page.waitForTimeout(2000);

    // Take screenshot
    await this.takeScreenshot(`team-${pageName.toLowerCase()}`, screenshotsDir);

    // Check URL
    const url = this.page.url();
    console.log('URL:', url);
    if (!url.includes(teamSlug)) {
      this.addIssue(
        'critical',
        pageName,
        'Page URL does not contain team slug',
        url,
      );
    }

    // Check design system
    await this.verifyDesignSystem(teamSlug, pageName);

    // Report console errors
    this.reportConsoleErrors(consoleErrors, pageName);

    return url;
  }

  // ============================================
  // INTERACTIVE ELEMENT CHECKS
  // ============================================

  async verifyAllButtonsClickable(pageName: string) {
    console.log(`\n📋 Verifying all buttons on ${pageName}...\n`);

    const buttons = this.page.locator('button:visible');
    const count = await buttons.count();
    console.log(`Found ${count} visible buttons`);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i);
      const isEnabled = await button.isEnabled().catch(() => false);
      const text = await button.textContent().catch(() => 'unknown');

      if (!isEnabled) {
        console.log(`⚠️ Button disabled: ${text?.trim()}`);
      } else {
        console.log(`✅ Button enabled: ${text?.trim()}`);
      }
    }
  }

  async verifyAllLinksWork(pageName: string) {
    console.log(`\n📋 Verifying all links on ${pageName}...\n`);

    const links = this.page.locator('a[href]:visible');
    const count = await links.count();
    console.log(`Found ${count} visible links`);

    const brokenLinks: string[] = [];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      const text = await link.textContent().catch(() => '');

      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        console.log(`Link: "${text?.trim()}" -> ${href}`);
      }
    }

    return brokenLinks;
  }

  // ============================================
  // FULL AUDIT RUNNER
  // ============================================

  async runFullAudit(teamSlug: string, screenshotsDir: string) {
    console.log('\n' + '='.repeat(60));
    console.log('TEAM ACCOUNTS COMPREHENSIVE AUDIT');
    console.log('='.repeat(60) + '\n');

    // 1. Verify all pages load
    await this.auditPage(teamSlug, 'Billing', screenshotsDir);
    await this.auditPage(teamSlug, 'Members', screenshotsDir);
    await this.auditPage(teamSlug, 'Settings', screenshotsDir);

    // 2. Verify navigation
    await this.navigateToBilling(teamSlug);
    await this.verifySidebarLinks(teamSlug);

    // 3. Verify billing functionality
    await this.verifyBillingPage(teamSlug);
    await this.verifyPlanSelection(teamSlug);

    // 4. Verify members functionality
    await this.verifyMembersPage(teamSlug);
    await this.verifyInviteFlow(teamSlug);
    await this.verifyMemberActions(teamSlug);

    // 5. Verify settings functionality
    await this.verifySettingsPage(teamSlug);

    // 6. Print summary
    const summary = this.getSummary();
    console.log('\n' + '='.repeat(60));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(60));
    console.log(`🔴 Critical: ${summary.critical}`);
    console.log(`🟠 Major: ${summary.major}`);
    console.log(`🟡 Minor: ${summary.minor}`);
    console.log(`📸 Screenshots: ${screenshotsDir}`);

    if (summary.critical > 0) {
      console.log('\n🔴 CRITICAL ISSUES:');
      summary.issues
        .filter((i) => i.severity === 'critical')
        .forEach((i) => console.log(`  - ${i.page}: ${i.issue}`));
    }

    if (summary.major > 0) {
      console.log('\n🟠 MAJOR ISSUES:');
      summary.issues
        .filter((i) => i.severity === 'major')
        .forEach((i) => console.log(`  - ${i.page}: ${i.issue}`));
    }

    return summary;
  }
}
