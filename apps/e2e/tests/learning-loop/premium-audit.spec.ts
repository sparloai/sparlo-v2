/**
 * Premium Product Audit - $499/mo Quality Check
 *
 * Comprehensive audit of sparlo.ai for:
 * - Pixel-perfect design
 * - Hover states & interactions
 * - Animations
 * - Typography & spacing
 * - Premium feel assessment
 */
import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

const BASE_URL = 'https://sparlo.ai';

// Premium product audit checklist
interface AuditFinding {
  category: string;
  severity: 'critical' | 'major' | 'minor' | 'polish';
  element: string;
  issue: string;
  suggestion: string;
}

const findings: AuditFinding[] = [];

function addFinding(finding: AuditFinding) {
  findings.push(finding);
  console.log(`[${finding.severity.toUpperCase()}] ${finding.category}: ${finding.issue}`);
  console.log(`  Element: ${finding.element}`);
  console.log(`  Fix: ${finding.suggestion}\n`);
}

test.describe('Premium Product Audit - sparlo.ai', () => {
  test.setTimeout(300000); // 5 minutes for full audit

  test('Full site premium audit', async ({ page }) => {
    console.log('\n========================================');
    console.log('SPARLO.AI PREMIUM PRODUCT AUDIT');
    console.log('Target: $499/mo quality standard');
    console.log('========================================\n');

    // 1. LANDING PAGE AUDIT
    console.log('--- LANDING PAGE AUDIT ---\n');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await auditPage(page, 'Landing Page');

    // Take screenshot
    await page.screenshot({ path: 'test-results/audit-landing.png', fullPage: true });

    // 2. LOGIN FLOW
    console.log('\n--- LOGIN FLOW AUDIT ---\n');

    // Find and click sign in
    const signInLink = page.locator('a:has-text("Sign In"), a:has-text("Log In"), button:has-text("Sign In")').first();
    if (await signInLink.isVisible()) {
      await signInLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto(`${BASE_URL}/auth/sign-in`);
      await page.waitForLoadState('networkidle');
    }

    await auditPage(page, 'Sign In Page');
    await page.screenshot({ path: 'test-results/audit-signin.png', fullPage: true });

    // Perform login
    await page.fill('input[type="email"], input[name="email"]', CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', CREDENTIALS.password);

    // Check input styling
    await auditInputs(page);

    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for redirect

    // 3. DASHBOARD AUDIT
    console.log('\n--- DASHBOARD AUDIT ---\n');
    await page.screenshot({ path: 'test-results/audit-dashboard.png', fullPage: true });
    await auditPage(page, 'Dashboard');
    await auditNavigation(page);
    await auditCards(page);
    await auditButtons(page);
    await auditTypography(page);
    await auditSpacing(page);
    await auditHoverStates(page);

    // 4. NAVIGATE THROUGH KEY PAGES
    const navLinks = page.locator('nav a, aside a, [role="navigation"] a');
    const linkCount = await navLinks.count();

    const visitedUrls = new Set<string>();
    visitedUrls.add(page.url());

    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !visitedUrls.has(href)) {
        try {
          await link.click();
          await page.waitForLoadState('networkidle');
          visitedUrls.add(page.url());

          const pageName = href.split('/').pop() || 'Page';
          console.log(`\n--- ${pageName.toUpperCase()} PAGE AUDIT ---\n`);

          await page.screenshot({
            path: `test-results/audit-${pageName.replace(/[^a-z0-9]/gi, '-')}.png`,
            fullPage: true
          });

          await auditPage(page, pageName);
          await auditTypography(page);
          await auditSpacing(page);
        } catch (e) {
          // Navigation failed, continue
        }
      }
    }

    // 5. ACCESSIBILITY AUDIT
    console.log('\n--- ACCESSIBILITY AUDIT ---\n');
    const a11yResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    for (const violation of a11yResults.violations) {
      addFinding({
        category: 'Accessibility',
        severity: violation.impact === 'critical' ? 'critical' :
                  violation.impact === 'serious' ? 'major' : 'minor',
        element: violation.nodes[0]?.html.slice(0, 100) || 'unknown',
        issue: violation.help,
        suggestion: violation.helpUrl,
      });
    }

    // 6. FINAL REPORT
    console.log('\n========================================');
    console.log('AUDIT COMPLETE - SUMMARY');
    console.log('========================================\n');

    const critical = findings.filter(f => f.severity === 'critical').length;
    const major = findings.filter(f => f.severity === 'major').length;
    const minor = findings.filter(f => f.severity === 'minor').length;
    const polish = findings.filter(f => f.severity === 'polish').length;

    console.log(`Critical Issues: ${critical}`);
    console.log(`Major Issues: ${major}`);
    console.log(`Minor Issues: ${minor}`);
    console.log(`Polish Items: ${polish}`);
    console.log(`Total Findings: ${findings.length}`);

    const isPremiumQuality = critical === 0 && major <= 2;
    console.log(`\n$499/mo Premium Quality: ${isPremiumQuality ? '✅ YES' : '❌ NO'}`);

    if (!isPremiumQuality) {
      console.log('\nTo achieve premium quality, address:');
      findings.filter(f => f.severity === 'critical' || f.severity === 'major')
        .forEach(f => console.log(`  - [${f.severity}] ${f.issue}`));
    }

    // Don't fail the test - this is an audit
    expect(true).toBe(true);
  });
});

async function auditPage(page: Page, pageName: string) {
  // Check for broken images
  const images = page.locator('img');
  const imgCount = await images.count();
  for (let i = 0; i < imgCount; i++) {
    const img = images.nth(i);
    const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
    if (naturalWidth === 0) {
      addFinding({
        category: 'Images',
        severity: 'major',
        element: await img.getAttribute('src') || 'unknown',
        issue: `Broken image on ${pageName}`,
        suggestion: 'Fix image source or add fallback',
      });
    }
  }

  // Check for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      addFinding({
        category: 'Console',
        severity: 'minor',
        element: pageName,
        issue: `Console error: ${msg.text().slice(0, 100)}`,
        suggestion: 'Fix console errors for polish',
      });
    }
  });

  // Check page load performance
  const loadTime = await page.evaluate(() => {
    const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return timing ? timing.loadEventEnd - timing.startTime : 0;
  });

  if (loadTime > 3000) {
    addFinding({
      category: 'Performance',
      severity: 'major',
      element: pageName,
      issue: `Slow page load: ${Math.round(loadTime)}ms`,
      suggestion: 'Optimize for <3s load time',
    });
  }
}

async function auditInputs(page: Page) {
  const inputs = page.locator('input, textarea, select');
  const count = await inputs.count();

  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    if (!await input.isVisible()) continue;

    const styles = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        borderRadius: s.borderRadius,
        padding: s.padding,
        fontSize: s.fontSize,
        border: s.border,
        outline: s.outline,
      };
    });

    // Check for proper focus states
    await input.focus();
    const focusStyles = await input.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        outline: s.outline,
        boxShadow: s.boxShadow,
        borderColor: s.borderColor,
      };
    });

    if (focusStyles.outline === 'none' && !focusStyles.boxShadow.includes('rgb')) {
      addFinding({
        category: 'Focus States',
        severity: 'major',
        element: `Input ${i}`,
        issue: 'Missing visible focus indicator',
        suggestion: 'Add ring-2 ring-zinc-400 or similar focus style',
      });
    }

    // Check font size (should be at least 16px to prevent iOS zoom)
    const fontSize = parseFloat(styles.fontSize);
    if (fontSize < 16) {
      addFinding({
        category: 'Inputs',
        severity: 'minor',
        element: `Input ${i}`,
        issue: `Input font size ${styles.fontSize} < 16px (causes iOS zoom)`,
        suggestion: 'Use text-base (16px) or larger',
      });
    }
  }
}

async function auditNavigation(page: Page) {
  const nav = page.locator('nav, [role="navigation"]').first();
  if (!await nav.isVisible()) return;

  // Check nav items for proper spacing
  const navItems = nav.locator('a, button');
  const count = await navItems.count();

  for (let i = 0; i < count - 1; i++) {
    const current = await navItems.nth(i).boundingBox();
    const next = await navItems.nth(i + 1).boundingBox();

    if (current && next) {
      const gap = next.x - (current.x + current.width);
      if (gap < 8) {
        addFinding({
          category: 'Spacing',
          severity: 'polish',
          element: 'Navigation items',
          issue: `Nav items too close (${Math.round(gap)}px gap)`,
          suggestion: 'Add gap-4 or gap-6 between nav items',
        });
        break;
      }
    }
  }
}

async function auditCards(page: Page) {
  const cards = page.locator('[class*="card"], [class*="rounded-xl"], [class*="shadow"]');
  const count = await cards.count();

  for (let i = 0; i < Math.min(count, 10); i++) {
    const card = cards.nth(i);
    if (!await card.isVisible()) continue;

    const styles = await card.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        borderRadius: s.borderRadius,
        padding: s.padding,
        boxShadow: s.boxShadow,
        backgroundColor: s.backgroundColor,
      };
    });

    // Check for consistent card styling
    const radiusPx = parseFloat(styles.borderRadius);
    if (radiusPx > 0 && radiusPx < 8) {
      addFinding({
        category: 'Cards',
        severity: 'polish',
        element: `Card ${i}`,
        issue: `Card border radius ${styles.borderRadius} not consistent with design system`,
        suggestion: 'Use rounded-xl (12px) for cards per design system',
      });
    }
  }
}

async function auditButtons(page: Page) {
  const buttons = page.locator('button, a[class*="btn"], [role="button"]');
  const count = await buttons.count();

  for (let i = 0; i < Math.min(count, 15); i++) {
    const button = buttons.nth(i);
    if (!await button.isVisible()) continue;

    const box = await button.boundingBox();
    if (box) {
      // Check touch target size
      if (box.height < 44 || box.width < 44) {
        const text = await button.textContent();
        addFinding({
          category: 'Touch Targets',
          severity: 'minor',
          element: `Button "${text?.slice(0, 20)}"`,
          issue: `Button ${Math.round(box.width)}x${Math.round(box.height)}px < 44x44px`,
          suggestion: 'Add min-h-[44px] for accessibility',
        });
      }
    }

    // Check hover state
    await button.hover();
    await page.waitForTimeout(100);

    const hoverStyles = await button.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        cursor: s.cursor,
        transform: s.transform,
        transition: s.transition,
      };
    });

    if (hoverStyles.cursor !== 'pointer') {
      addFinding({
        category: 'Hover States',
        severity: 'minor',
        element: `Button ${i}`,
        issue: 'Button missing cursor: pointer',
        suggestion: 'Add cursor-pointer class',
      });
    }

    if (!hoverStyles.transition || hoverStyles.transition === 'none' || hoverStyles.transition === 'all 0s ease 0s') {
      addFinding({
        category: 'Animations',
        severity: 'polish',
        element: `Button ${i}`,
        issue: 'Button missing hover transition',
        suggestion: 'Add transition-colors for smooth hover effect',
      });
    }
  }
}

async function auditTypography(page: Page) {
  // Check heading hierarchy
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

  let lastLevel = 0;
  for (const heading of headings) {
    const tag = await heading.evaluate(el => el.tagName);
    const level = parseInt(tag.replace('H', ''));

    if (level > lastLevel + 1 && lastLevel > 0) {
      addFinding({
        category: 'Typography',
        severity: 'minor',
        element: tag,
        issue: `Skipped heading level (H${lastLevel} to H${level})`,
        suggestion: 'Use proper heading hierarchy for accessibility',
      });
    }
    lastLevel = level;
  }

  // Check body text size
  const paragraphs = page.locator('p');
  const pCount = await paragraphs.count();

  for (let i = 0; i < Math.min(pCount, 5); i++) {
    const p = paragraphs.nth(i);
    if (!await p.isVisible()) continue;

    const fontSize = await p.evaluate(el => getComputedStyle(el).fontSize);
    const size = parseFloat(fontSize);

    if (size < 16) {
      addFinding({
        category: 'Typography',
        severity: 'minor',
        element: 'Body text',
        issue: `Body text ${fontSize} < 16px`,
        suggestion: 'Use text-base (16px) or text-lg (18px) for readability',
      });
      break;
    }
  }

  // Check line height
  const textElements = page.locator('p, li, span').first();
  if (await textElements.isVisible()) {
    const lineHeight = await textElements.evaluate(el => {
      const s = getComputedStyle(el);
      const lh = parseFloat(s.lineHeight);
      const fs = parseFloat(s.fontSize);
      return lh / fs;
    });

    if (lineHeight < 1.4) {
      addFinding({
        category: 'Typography',
        severity: 'polish',
        element: 'Body text',
        issue: `Line height ${lineHeight.toFixed(2)} too tight`,
        suggestion: 'Use leading-relaxed (1.625) for body text',
      });
    }
  }
}

async function auditSpacing(page: Page) {
  // Check for consistent section spacing
  const sections = page.locator('section, main > div');
  const count = await sections.count();

  const paddings: number[] = [];
  for (let i = 0; i < Math.min(count, 5); i++) {
    const section = sections.nth(i);
    if (!await section.isVisible()) continue;

    const padding = await section.evaluate(el => {
      const s = getComputedStyle(el);
      return parseFloat(s.paddingTop) + parseFloat(s.paddingBottom);
    });
    paddings.push(padding);
  }

  // Check for inconsistent spacing
  const uniquePaddings = new Set(paddings.map(p => Math.round(p / 8) * 8));
  if (uniquePaddings.size > 3) {
    addFinding({
      category: 'Spacing',
      severity: 'polish',
      element: 'Sections',
      issue: 'Inconsistent section padding',
      suggestion: 'Use consistent py-12 or py-16 for sections',
    });
  }
}

async function auditHoverStates(page: Page) {
  // Check links for hover states
  const links = page.locator('a:not([class*="btn"])');
  const count = await links.count();

  for (let i = 0; i < Math.min(count, 10); i++) {
    const link = links.nth(i);
    if (!await link.isVisible()) continue;

    const initialColor = await link.evaluate(el => getComputedStyle(el).color);

    await link.hover();
    await page.waitForTimeout(50);

    const hoverColor = await link.evaluate(el => getComputedStyle(el).color);
    const hasUnderline = await link.evaluate(el =>
      getComputedStyle(el).textDecoration.includes('underline')
    );

    if (initialColor === hoverColor && !hasUnderline) {
      const text = await link.textContent();
      addFinding({
        category: 'Hover States',
        severity: 'polish',
        element: `Link "${text?.slice(0, 20)}"`,
        issue: 'Link has no visible hover state',
        suggestion: 'Add hover:text-zinc-600 or hover:underline',
      });
      break; // Only report once
    }
  }
}
