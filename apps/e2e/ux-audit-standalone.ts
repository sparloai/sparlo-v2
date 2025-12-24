/**
 * Standalone UX Audit Script
 * Runs directly with Playwright API, bypassing test runner
 */

import { chromium, type Page } from '@playwright/test';
import { mkdir } from 'fs/promises';

const PRODUCTION_URL = 'https://sparlo.ai';
const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

const OUTPUT_DIR = 'test-results/ux-audit';

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

async function auditNewReportPage(page: Page) {
  console.log('\n📋 Auditing: New Report Page - Visual Polish');
  console.log('='.repeat(60));

  await page.goto(`${PRODUCTION_URL}/home/reports/new`);
  await page.waitForLoadState('networkidle');

  // Take baseline screenshot
  await page.screenshot({
    path: `${OUTPUT_DIR}/new-report-baseline.png`,
    fullPage: true,
  });
  console.log('  ✅ Baseline screenshot captured');

  // Check textarea
  const textarea = page.locator('textarea[data-test="challenge-input"]');
  const isTextareaVisible = await textarea.isVisible();
  console.log(`  📝 Textarea visible: ${isTextareaVisible ? '✅' : '❌'}`);

  const placeholder = await textarea.getAttribute('placeholder');
  console.log(`  📝 Placeholder: "${placeholder}"`);

  // Test context detection
  await textarea.fill('I need to reduce heat sink weight by 40% while maintaining thermal performance');
  await page.waitForTimeout(500);

  await page.screenshot({
    path: `${OUTPUT_DIR}/new-report-with-input.png`,
    fullPage: true,
  });

  const contextIndicators = await page.locator('text=/Technical Goals|Material Constraints|Cost Parameters/i').count();
  console.log(`  🎯 Context indicators detected: ${contextIndicators}`);

  // Check submit button
  const submitButton = page.locator('button[data-test="challenge-submit"]');
  const isEnabled = await submitButton.isEnabled();
  console.log(`  ✅ Submit button enabled: ${isEnabled ? 'YES' : 'NO'}`);

  // Trust signals
  const trustSignals = await page.locator('text=/DATA NEVER TRAINS AI|SOC2 INFRASTRUCTURE/i').count();
  console.log(`  🔒 Trust signals visible: ${trustSignals}`);

  // Attach button
  const attachButton = page.locator('button:has-text("Attach")');
  const isAttachVisible = await attachButton.isVisible();
  console.log(`  📎 Attach button visible: ${isAttachVisible ? '✅' : '❌'}`);

  await attachButton.screenshot({ path: `${OUTPUT_DIR}/attach-button.png` });
}

async function auditResponsive(page: Page) {
  console.log('\n📱 Auditing: Responsive Behavior');
  console.log('='.repeat(60));

  await page.goto(`${PRODUCTION_URL}/home/reports/new`);

  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${OUTPUT_DIR}/new-report-tablet.png`,
    fullPage: true,
  });
  console.log('  ✅ Tablet screenshot captured (768px)');

  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${OUTPUT_DIR}/new-report-mobile.png`,
    fullPage: true,
  });
  console.log('  ✅ Mobile screenshot captured (375px)');

  const textarea = page.locator('textarea[data-test="challenge-input"]');
  const textareaVisible = await textarea.isVisible();
  console.log(`  📱 Textarea accessible on mobile: ${textareaVisible ? '✅' : '❌'}`);

  // Reset
  await page.setViewportSize({ width: 1920, height: 1080 });
}

async function auditAccessibility(page: Page) {
  console.log('\n♿ Auditing: Accessibility & Contrast');
  console.log('='.repeat(60));

  await page.goto(`${PRODUCTION_URL}/home/reports/new`);

  const textarea = page.locator('textarea[data-test="challenge-input"]');
  const styles = await textarea.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      color: computed.color,
      background: computed.backgroundColor,
      fontSize: computed.fontSize,
      lineHeight: computed.lineHeight,
    };
  });

  console.log('  🎨 Textarea styles:');
  console.log(`     Color: ${styles.color}`);
  console.log(`     Background: ${styles.background}`);
  console.log(`     Font size: ${styles.fontSize}`);
  console.log(`     Line height: ${styles.lineHeight}`);

  await textarea.focus();
  await page.screenshot({ path: `${OUTPUT_DIR}/textarea-focused.png` });
  console.log('  ✅ Focus state screenshot captured');

  const submitButton = page.locator('button[data-test="challenge-submit"]');
  await submitButton.focus();
  await page.screenshot({ path: `${OUTPUT_DIR}/submit-button-focused.png` });
  console.log('  ✅ Button focus state screenshot captured');
}

async function auditPerformance(page: Page) {
  console.log('\n⚡ Auditing: Performance');
  console.log('='.repeat(60));

  const startTime = Date.now();
  await page.goto(`${PRODUCTION_URL}/home/reports/new`);
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - startTime;

  console.log(`  ⏱️  Page load time: ${loadTime}ms`);

  if (loadTime > 3000) {
    console.log('  ⚠️  Load time exceeds 3 seconds');
  } else {
    console.log('  ✅ Load time acceptable');
  }

  await page.waitForTimeout(1000);
  await page.screenshot({
    path: `${OUTPUT_DIR}/after-settle.png`,
    fullPage: true,
  });
}

async function auditNavigation(page: Page) {
  console.log('\n🧭 Auditing: Navigation & Information Architecture');
  console.log('='.repeat(60));

  await page.goto(`${PRODUCTION_URL}/home`);
  await page.screenshot({
    path: `${OUTPUT_DIR}/home-page.png`,
    fullPage: true,
  });
  console.log('  ✅ Home page screenshot captured');

  const newReportLink = await page.locator('a[href*="/reports/new"], button:has-text("New")').first().isVisible({ timeout: 2000 }).catch(() => false);

  if (newReportLink) {
    console.log('  ✅ Clear path to new report found');
    await page.locator('a[href*="/reports/new"], button:has-text("New")').first().screenshot({
      path: `${OUTPUT_DIR}/new-report-cta.png`,
    });
  } else {
    console.log('  ❌ No clear path to new report - ISSUE');
  }

  const reportsSection = await page.locator('text=/Reports|History|Past Analysis/i').first().isVisible({ timeout: 2000 }).catch(() => false);

  if (reportsSection) {
    console.log('  ✅ Reports history section found');
  } else {
    console.log('  ⚠️  No obvious reports history section');
  }
}

async function auditDarkMode(page: Page) {
  console.log('\n🌙 Auditing: Dark Mode');
  console.log('='.repeat(60));

  await page.goto(`${PRODUCTION_URL}/home/reports/new`);

  await page.screenshot({
    path: `${OUTPUT_DIR}/current-theme.png`,
    fullPage: true,
  });
  console.log('  ✅ Current theme screenshot captured');

  // Force dark mode via media query
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.screenshot({
    path: `${OUTPUT_DIR}/dark-mode-forced.png`,
    fullPage: true,
  });
  console.log('  ✅ Dark mode screenshot captured');
}

// Main execution
async function main() {
  // Ensure output directory exists
  await mkdir(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    console.log('\n🚀 Starting Sparlo UX Audit on Production');
    console.log('🌐 Target: ' + PRODUCTION_URL);
    console.log('='.repeat(60));

    await ensureAuthenticated(page);

    await auditNewReportPage(page);
    await auditResponsive(page);
    await auditAccessibility(page);
    await auditPerformance(page);
    await auditNavigation(page);
    await auditDarkMode(page);

    console.log('\n✅ UX Audit Complete!');
    console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}/`);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Audit failed:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
