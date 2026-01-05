/**
 * Accessibility Compliance Tests for UX/UI Learning Loop
 *
 * Uses @axe-core/playwright for WCAG 2.1 AA validation.
 * Optimized for fast execution (<15s) in the PostToolUse hook.
 *
 * Based on axe-core best practices:
 * - Use withTags() to filter to relevant WCAG rules
 * - Filter by impact level for actionable failures
 * - Exclude known false positives with exclude()
 * - Structure output for Claude consumption
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Test timeout: 30s max for learning loop
test.setTimeout(30000);

test.describe('Accessibility Compliance @fast', () => {
  // Note: These tests run on public pages only (no auth required)
  // This enables fast feedback in the learning loop

  test('landing page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('iframe[src*="youtube"]')
      .exclude('iframe[src*="vimeo"]')
      .exclude('iframe[src*="google"]')
      .analyze();

    const actionableViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (actionableViolations.length > 0) {
      console.error('ACCESSIBILITY VIOLATIONS:');
      actionableViolations.forEach((v) => {
        console.error(`\n[${v.impact?.toUpperCase()}] ${v.id}: ${v.help}`);
        console.error(`  Description: ${v.description}`);
        console.error(`  Help: ${v.helpUrl}`);
        v.nodes.slice(0, 2).forEach((n) => {
          console.error(`  Element: ${n.html.slice(0, 100)}`);
          console.error(`  Fix: ${n.failureSummary}`);
        });
      });
    }

    expect(
      actionableViolations,
      'Critical/serious accessibility violations found'
    ).toEqual([]);
  });

  test('sign-in page meets WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (critical.length > 0) {
      console.error('SIGN-IN PAGE ACCESSIBILITY VIOLATIONS:');
      critical.forEach((v) => {
        console.error(`  [${v.impact}] ${v.id}: ${v.help}`);
      });
    }

    expect(critical).toEqual([]);
  });

  test('interactive elements have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withRules(['button-name', 'link-name', 'label', 'input-button-name'])
      .analyze();

    const violations = results.violations;

    if (violations.length > 0) {
      console.error('MISSING ACCESSIBLE NAMES:');
      violations.forEach((v) => {
        console.error(`  ${v.id}:`);
        v.nodes.slice(0, 3).forEach((n) => {
          console.error(`    - ${n.html.slice(0, 80)}`);
        });
      });
      console.error('\nFix: Add aria-label or visible text to elements.');
    }

    expect(violations).toEqual([]);
  });

  test('color contrast meets WCAG AA (4.5:1)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    const contrastViolations = results.violations;

    if (contrastViolations.length > 0) {
      console.error('COLOR CONTRAST VIOLATIONS:');
      contrastViolations.forEach((v) => {
        v.nodes.slice(0, 3).forEach((n) => {
          console.error(`  - ${n.target[0]}: ${n.failureSummary}`);
        });
      });
      console.error(
        '\nFix: Use zinc-700 or darker for text. Ref: docs/SPARLO-DESIGN-SYSTEM.md'
      );
    }

    expect(contrastViolations).toEqual([]);
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withRules(['label', 'select-name', 'input-image-alt'])
      .analyze();

    if (results.violations.length > 0) {
      console.error('FORM LABEL VIOLATIONS:');
      results.violations.forEach((v) => {
        console.error(`  ${v.id}: ${v.help}`);
        v.nodes.slice(0, 2).forEach((n) => {
          console.error(`    Element: ${n.html.slice(0, 60)}`);
        });
      });
    }

    expect(results.violations).toEqual([]);
  });

  test('touch targets are 44x44px minimum', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const buttons = page.locator('button, a[href], [role="button"]');
    const count = await buttons.count();

    const violations: string[] = [];

    for (let i = 0; i < Math.min(count, 20); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();
      if (!isVisible) continue;

      const box = await button.boundingBox();

      if (box && (box.width < 44 || box.height < 44)) {
        if (box.width < 32 || box.height < 32) {
          const text = (await button.textContent())?.trim().slice(0, 20) || '';
          const ariaLabel = await button.getAttribute('aria-label');
          const label = text || ariaLabel || 'unknown';
          violations.push(
            `"${label}" is ${Math.round(box.width)}x${Math.round(box.height)}px (min: 44x44)`
          );
        }
      }
    }

    if (violations.length > 0) {
      console.error('TOUCH TARGET VIOLATIONS:');
      violations.slice(0, 5).forEach((v) => console.error(`  - ${v}`));
      console.error('\nFix: Add min-h-[44px] min-w-[44px] or padding.');
    }

    expect(violations.slice(0, 3)).toEqual([]);
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const results = await new AxeBuilder({ page })
      .withRules(['focus-order-semantics', 'focusable-no-name'])
      .analyze();

    if (results.violations.length > 0) {
      console.error('KEYBOARD NAVIGATION ISSUES:');
      results.violations.forEach((v) => {
        console.error(`  ${v.id}: ${v.help}`);
      });
    }

    expect(results.violations).toEqual([]);
  });
});
