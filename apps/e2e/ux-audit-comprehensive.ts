/**
 * COMPREHENSIVE UX Audit Script for Sparlo
 * Tests EVERY page in the application with detailed UX criteria
 */

import { chromium, type Page } from '@playwright/test';
import { mkdir } from 'fs/promises';

const PRODUCTION_URL = 'https://sparlo.ai';
const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

const OUTPUT_DIR = 'test-results/ux-audit-full';

interface AuditResult {
  page: string;
  url: string;
  issues: string[];
  score: number;
  screenshotPath: string;
}

const auditResults: AuditResult[] = [];

// Pages to audit
const PAGES_TO_AUDIT = [
  { name: 'Dashboard', path: '/home', priority: 'high' },
  { name: 'New Report', path: '/home/reports/new', priority: 'critical' },
  { name: 'Discovery Report', path: '/home/reports/discovery/new', priority: 'high' },
  { name: 'Hybrid Report', path: '/home/reports/hybrid/new', priority: 'high' },
  { name: 'Archived Reports', path: '/home/archived', priority: 'medium' },
  { name: 'Settings', path: '/home/settings', priority: 'medium' },
  { name: 'Billing', path: '/home/billing', priority: 'high' },
];

async function ensureAuthenticated(page: Page) {
  console.log('🔐 Authenticating...');
  await page.goto(`${PRODUCTION_URL}/home`);

  const currentUrl = page.url();
  const isAuthPage = currentUrl.includes('/auth') || currentUrl.includes('/sign-in');

  if (isAuthPage) {
    console.log('  → Filling credentials...');
    await page.fill('input[type="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"]', TEST_CREDENTIALS.password);

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    await page.waitForURL(/\/home/, { timeout: 15000 });
    console.log('  ✅ Authenticated successfully');
  } else {
    console.log('  ✅ Already authenticated');
  }
}

/**
 * Comprehensive UX audit for a single page
 */
async function auditPage(page: Page, pageName: string, pagePath: string): Promise<AuditResult> {
  const issues: string[] = [];
  let score = 100;

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📄 AUDITING: ${pageName}`);
  console.log(`🔗 URL: ${PRODUCTION_URL}${pagePath}`);
  console.log('='.repeat(70));

  const fullUrl = `${PRODUCTION_URL}${pagePath}`;
  const screenshotName = pageName.toLowerCase().replace(/\s+/g, '-');

  try {
    // Navigate to page
    await page.goto(fullUrl);
    await page.waitForLoadState('networkidle', { timeout: 15000 });

    // ============================================================
    // 1. PERFORMANCE AUDIT
    // ============================================================
    console.log('\n⚡ Performance Check');
    const perfStart = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - perfStart;

    console.log(`   Load time: ${loadTime}ms`);
    if (loadTime > 3000) {
      issues.push(`❌ Slow page load: ${loadTime}ms (should be < 3000ms)`);
      score -= 10;
    } else if (loadTime > 2000) {
      issues.push(`⚠️  Moderate load time: ${loadTime}ms (aim for < 2000ms)`);
      score -= 5;
    } else {
      console.log(`   ✅ Fast load time`);
    }

    // Screenshot: Desktop
    await page.screenshot({
      path: `${OUTPUT_DIR}/${screenshotName}-desktop.png`,
      fullPage: true,
    });

    // ============================================================
    // 2. VISUAL HIERARCHY & TYPOGRAPHY
    // ============================================================
    console.log('\n📐 Visual Hierarchy Check');

    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();

    console.log(`   H1 tags: ${h1Count}`);
    console.log(`   H2 tags: ${h2Count}`);

    if (h1Count === 0) {
      issues.push('❌ No H1 heading found - poor SEO and hierarchy');
      score -= 15;
    } else if (h1Count > 1) {
      issues.push('⚠️  Multiple H1 tags - should have exactly one');
      score -= 5;
    } else {
      console.log('   ✅ Proper H1 usage');
    }

    // Check font consistency
    const fontFamilies = await page.evaluate(() => {
      const elements = document.querySelectorAll('body, h1, h2, h3, p, button');
      const fonts = new Set<string>();
      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        fonts.add(computed.fontFamily);
      });
      return Array.from(fonts);
    });

    console.log(`   Font families used: ${fontFamilies.length}`);
    if (fontFamilies.length > 4) {
      issues.push(`⚠️  Too many fonts (${fontFamilies.length}) - reduces visual consistency`);
      score -= 5;
    }

    // ============================================================
    // 3. ACCESSIBILITY AUDIT
    // ============================================================
    console.log('\n♿ Accessibility Check');

    // Check for alt text on images
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    const imagesWithoutAlt = images - imagesWithAlt;

    console.log(`   Images: ${images} total, ${imagesWithoutAlt} missing alt text`);
    if (imagesWithoutAlt > 0) {
      issues.push(`⚠️  ${imagesWithoutAlt} images missing alt text`);
      score -= imagesWithoutAlt * 2;
    } else if (images > 0) {
      console.log('   ✅ All images have alt text');
    }

    // Check for proper button/link labels
    const buttonsWithoutText = await page.locator('button:not(:has-text(/\\w+/))').count();
    if (buttonsWithoutText > 0) {
      issues.push(`❌ ${buttonsWithoutText} buttons without visible text`);
      score -= 10;
    }

    // Check form labels
    const inputs = await page.locator('input:visible').count();
    const labels = await page.locator('label').count();
    if (inputs > 0 && labels === 0) {
      issues.push('⚠️  Form inputs without labels');
      score -= 10;
    }

    // ============================================================
    // 4. RESPONSIVE DESIGN
    // ============================================================
    console.log('\n📱 Responsive Design Check');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/${screenshotName}-mobile.png`,
      fullPage: true,
    });

    // Check for horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      issues.push('❌ Horizontal scroll on mobile - layout broken');
      score -= 15;
    } else {
      console.log('   ✅ No horizontal scroll on mobile');
    }

    // Check if key elements are visible on mobile
    const navVisible = await page.locator('nav').isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`   Navigation visible: ${navVisible ? 'Yes' : 'No'}`);

    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${OUTPUT_DIR}/${screenshotName}-tablet.png`,
      fullPage: true,
    });

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // ============================================================
    // 5. INTERACTION QUALITY
    // ============================================================
    console.log('\n🖱️  Interaction Quality Check');

    // Check for hover states on interactive elements
    const buttons = page.locator('button:visible, a:visible');
    const buttonCount = await buttons.count();
    console.log(`   Interactive elements: ${buttonCount}`);

    // Check focus states
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.focus();

      await page.screenshot({
        path: `${OUTPUT_DIR}/${screenshotName}-focus-state.png`,
      });

      const focusOutlineStyle = await firstButton.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          boxShadow: computed.boxShadow,
        };
      });

      const hasFocusIndicator =
        focusOutlineStyle.outlineWidth !== '0px' ||
        focusOutlineStyle.outline !== 'none' ||
        focusOutlineStyle.boxShadow !== 'none';

      if (!hasFocusIndicator) {
        issues.push('❌ No visible focus indicator on interactive elements');
        score -= 15;
      } else {
        console.log('   ✅ Focus indicators present');
      }
    }

    // ============================================================
    // 6. CONTENT QUALITY
    // ============================================================
    console.log('\n📝 Content Quality Check');

    // Check for placeholder text
    const hasLorem = await page.locator('text=/lorem ipsum/i').count();
    if (hasLorem > 0) {
      issues.push('❌ Placeholder "lorem ipsum" text found');
      score -= 20;
    }

    // Check for broken links (sample first 10)
    const links = await page.locator('a[href]').all();
    const brokenLinks: string[] = [];

    for (let i = 0; i < Math.min(links.length, 10); i++) {
      const href = await links[i].getAttribute('href');
      if (href && href.startsWith('#') && href.length === 1) {
        brokenLinks.push(href);
      }
    }

    if (brokenLinks.length > 0) {
      issues.push(`⚠️  ${brokenLinks.length} placeholder links (href="#")`);
      score -= 5;
    }

    // ============================================================
    // 7. ERROR STATES & EMPTY STATES
    // ============================================================
    console.log('\n🚨 Error & Empty State Check');

    // Check for error messages
    const errorMessages = await page
      .locator('text=/error|failed|wrong|invalid/i')
      .count();
    if (errorMessages > 0) {
      console.log(`   ⚠️  ${errorMessages} error messages visible`);
      await page.screenshot({
        path: `${OUTPUT_DIR}/${screenshotName}-with-errors.png`,
        fullPage: true,
      });
    }

    // Check for empty states
    const emptyStateIndicators = await page
      .locator('text=/no.*found|empty|nothing here/i')
      .count();
    if (emptyStateIndicators > 0) {
      console.log(`   Empty state messages: ${emptyStateIndicators}`);
    }

    // ============================================================
    // 8. DARK MODE CONSISTENCY
    // ============================================================
    console.log('\n🌙 Dark Mode Check');

    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${OUTPUT_DIR}/${screenshotName}-dark.png`,
      fullPage: true,
    });

    // Check background color changed
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    console.log(`   Background color: ${bgColor}`);

    // Reset to light mode
    await page.emulateMedia({ colorScheme: 'light' });

    // ============================================================
    // 9. CONSOLE ERRORS
    // ============================================================
    console.log('\n🐛 Console Errors Check');

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (consoleErrors.length > 0) {
      console.log(`   ❌ ${consoleErrors.length} console errors:`);
      consoleErrors.slice(0, 3).forEach((err) => {
        console.log(`      - ${err.substring(0, 100)}`);
      });
      issues.push(`❌ ${consoleErrors.length} console errors`);
      score -= Math.min(consoleErrors.length * 3, 20);
    } else {
      console.log('   ✅ No console errors');
    }

    // ============================================================
    // FINAL SCORE
    // ============================================================
    score = Math.max(0, score); // Don't go below 0

    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 SCORE: ${score}/100`);
    console.log(`📋 Issues Found: ${issues.length}`);
    console.log('='.repeat(70));

    return {
      page: pageName,
      url: fullUrl,
      issues,
      score,
      screenshotPath: `${OUTPUT_DIR}/${screenshotName}-desktop.png`,
    };
  } catch (error) {
    console.error(`\n❌ ERROR auditing ${pageName}:`, error);
    issues.push(`❌ Failed to audit page: ${error}`);

    return {
      page: pageName,
      url: fullUrl,
      issues,
      score: 0,
      screenshotPath: '',
    };
  }
}

/**
 * Generate final report
 */
function generateReport() {
  console.log('\n\n');
  console.log('█'.repeat(80));
  console.log('  SPARLO UX AUDIT - FINAL REPORT');
  console.log('█'.repeat(80));

  const avgScore =
    auditResults.reduce((sum, r) => sum + r.score, 0) / auditResults.length;

  console.log(`\n📊 OVERALL SCORE: ${avgScore.toFixed(1)}/100`);
  console.log(`📄 Pages Audited: ${auditResults.length}`);

  // Sort by score (worst first)
  const sortedResults = [...auditResults].sort((a, b) => a.score - b.score);

  console.log('\n📉 PAGES BY SCORE (Worst to Best):\n');

  sortedResults.forEach((result, index) => {
    const emoji = result.score >= 90 ? '🟢' : result.score >= 70 ? '🟡' : '🔴';
    console.log(`${index + 1}. ${emoji} ${result.page}: ${result.score}/100`);

    if (result.issues.length > 0) {
      console.log(`   Issues (${result.issues.length}):`);
      result.issues.slice(0, 5).forEach((issue) => {
        console.log(`   ${issue}`);
      });
      if (result.issues.length > 5) {
        console.log(`   ... and ${result.issues.length - 5} more`);
      }
    }
    console.log('');
  });

  console.log('\n🔥 TOP PRIORITY FIXES:\n');

  const allIssues = sortedResults.flatMap((r) => ({
    page: r.page,
    issues: r.issues,
  }));

  // Count issue patterns
  const issuePatterns = new Map<string, number>();
  allIssues.forEach(({ issues }) => {
    issues.forEach((issue) => {
      const pattern = issue.split(':')[0]; // Get issue category
      issuePatterns.set(pattern, (issuePatterns.get(pattern) || 0) + 1);
    });
  });

  // Sort by frequency
  const sortedPatterns = Array.from(issuePatterns.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sortedPatterns.forEach(([pattern, count], index) => {
    console.log(`${index + 1}. ${pattern} (appears on ${count} pages)`);
  });

  console.log('\n📁 Screenshots saved to:', OUTPUT_DIR);
  console.log('\n█'.repeat(80));
}

// Main execution
async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  try {
    console.log('\n🚀 Starting COMPREHENSIVE Sparlo UX Audit');
    console.log('🌐 Target: ' + PRODUCTION_URL);
    console.log(`📄 Pages to audit: ${PAGES_TO_AUDIT.length}`);
    console.log('='.repeat(80));

    await ensureAuthenticated(page);

    // Audit each page
    for (const { name, path } of PAGES_TO_AUDIT) {
      const result = await auditPage(page, name, path);
      auditResults.push(result);
    }

    // Generate final report
    generateReport();

    console.log('\n✅ Comprehensive UX Audit Complete!');
  } catch (error) {
    console.error('\n❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
