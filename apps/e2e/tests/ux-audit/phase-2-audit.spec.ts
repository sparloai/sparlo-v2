import { test, expect, Page } from '@playwright/test';

const SITE_URL = 'https://sparlo.ai';
const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/phase2';
const TEST_EMAIL = 'swimakaswim@gmail.com';
const TEST_PASSWORD = 'Linguine2025';

test.describe('Phase 2 Audit: Free Report Experience', () => {

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
  });

  test('2.1 Dashboard - First View After Login', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Let content load

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-after-login.png`,
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-dashboard-full.png`,
      fullPage: true
    });

    // Analyze dashboard structure
    const dashboardAnalysis = await page.evaluate(() => {
      return {
        hasReportsList: !!document.querySelector('[class*="report"], [class*="list"]'),
        hasNewButton: !!document.querySelector('a[href*="new"], button:has-text("New")'),
        hasSearch: !!document.querySelector('input[type="search"], input[placeholder*="search"]'),
        reportCount: document.querySelectorAll('[class*="card"], [class*="report-item"]').length,
        hasEmptyState: document.body.innerText.includes('no reports') || document.body.innerText.includes('get started'),
      };
    });

    console.log('Dashboard Analysis:', JSON.stringify(dashboardAnalysis, null, 2));
  });

  test('2.2 Report Cards - Different States', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find reports in different states
    const reportStates = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="card"], [data-test*="report"]'));
      return cards.slice(0, 10).map(card => {
        const text = card.textContent || '';
        return {
          hasProcessing: text.toLowerCase().includes('processing'),
          hasComplete: text.toLowerCase().includes('complete') || card.querySelector('[class*="green"]'),
          hasFailed: text.toLowerCase().includes('failed') || text.toLowerCase().includes('error'),
          hasCancel: !!card.querySelector('button:has-text("Cancel")'),
          title: card.querySelector('h2, h3, [class*="title"]')?.textContent?.trim().slice(0, 50)
        };
      });
    });

    console.log('Report States:', JSON.stringify(reportStates, null, 2));
  });

  test('2.3 View Completed Report', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Find and click a completed report
    // Look for green indicator or "Complete" text
    const reportLinks = await page.locator('a[href*="/reports/"]').all();

    for (const link of reportLinks.slice(0, 5)) {
      try {
        const href = await link.getAttribute('href');
        if (href && !href.includes('new')) {
          await link.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          // Screenshot report view
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/03-report-view-top.png`,
          });

          await page.screenshot({
            path: `${SCREENSHOT_DIR}/04-report-view-full.png`,
            fullPage: true
          });

          // Analyze report structure
          const reportStructure = await page.evaluate(() => {
            return {
              hasTitle: !!document.querySelector('h1'),
              hasTOC: !!document.querySelector('nav, [class*="toc"], [class*="contents"], [class*="sidebar"]'),
              sectionCount: document.querySelectorAll('h2').length,
              hasExport: !!document.querySelector('button:has-text("Export"), a:has-text("Export"), [class*="export"]'),
              hasShare: !!document.querySelector('button:has-text("Share"), a:has-text("Share"), [class*="share"]'),
              hasBackButton: !!document.querySelector('a:has-text("Back"), [class*="back"]'),
              estimatedReadTime: document.body.innerText.match(/\d+\s*min\s*read/i)?.[0],
              wordCount: document.body.innerText.split(/\s+/).length,
            };
          });

          console.log('Report Structure:', JSON.stringify(reportStructure, null, 2));
          break;
        }
      } catch (e) {
        console.log('Could not click report link');
      }
    }
  });

  test('2.4 Report Navigation (TOC)', async ({ page }) => {
    // Go to a specific report
    await page.goto(`${SITE_URL}/home`);
    await page.waitForLoadState('networkidle');

    const firstReport = page.locator('a[href*="/reports/"]').first();
    if (await firstReport.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstReport.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check for TOC/navigation
      const tocItems = await page.locator('nav a, [class*="toc"] a, [class*="contents"] a').all();
      console.log(`TOC Items Found: ${tocItems.length}`);

      // Screenshot the navigation sidebar if exists
      const sidebar = page.locator('[class*="sidebar"], [class*="toc"], nav').first();
      if (await sidebar.isVisible().catch(() => false)) {
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/05-report-toc.png`,
        });
      }

      // Try clicking a TOC item
      if (tocItems.length > 2) {
        await tocItems[2].click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/06-report-section-jump.png`,
        });
      }
    }
  });

  test('2.5 Report Export Options', async ({ page }) => {
    await page.goto(`${SITE_URL}/home`);
    await page.waitForLoadState('networkidle');

    const firstReport = page.locator('a[href*="/reports/"]').first();
    if (await firstReport.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstReport.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Find export button
      const exportButton = page.locator('button:has-text("Export"), [class*="export"]').first();
      if (await exportButton.isVisible().catch(() => false)) {
        await exportButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/07-export-options.png`,
        });
      }

      // Find share button
      const shareButton = page.locator('button:has-text("Share"), [class*="share"]').first();
      if (await shareButton.isVisible().catch(() => false)) {
        await shareButton.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/08-share-options.png`,
        });
      }
    }
  });

  test('2.6 Processing Report View', async ({ page }) => {
    await page.goto(`${SITE_URL}/home`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for a processing report
    const processingIndicator = page.locator('text=/processing|running|generating/i').first();
    if (await processingIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Find parent card and click
      const card = processingIndicator.locator('xpath=ancestor::a | ancestor::div[contains(@class, "card")]').first();
      await card.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/09-processing-report-view.png`,
      });

      // Analyze waiting experience
      const waitingExperience = await page.evaluate(() => {
        return {
          hasProgress: !!document.querySelector('[class*="progress"], [role="progressbar"]'),
          hasTimer: document.body.innerText.match(/\d+:\d+|\d+\s*min/i)?.[0],
          hasSteps: document.body.innerText.includes('step') || document.body.innerText.includes('stage'),
          hasCancelOption: !!document.querySelector('button:has-text("Cancel")'),
          hasCloseMessage: document.body.innerText.toLowerCase().includes('safe to close'),
          statusMessage: document.body.innerText.match(/processing|analyzing|generating|running/i)?.[0],
        };
      });

      console.log('Waiting Experience:', JSON.stringify(waitingExperience, null, 2));
    } else {
      console.log('No processing reports found - all complete');
    }
  });

  test('2.7 Billing/Subscription Page', async ({ page }) => {
    // Check where conversion happens
    await page.goto(`${SITE_URL}/home/settings/billing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-billing-page.png`,
      fullPage: true
    });

    // Analyze pricing presentation
    const pricingAnalysis = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        showsPrice: text.includes('$') || text.includes('price'),
        hasPlans: text.toLowerCase().includes('plan') || text.toLowerCase().includes('tier'),
        hasFreeTier: text.toLowerCase().includes('free'),
        hasUpgradeButton: !!document.querySelector('button:has-text("Upgrade"), a:has-text("Upgrade")'),
        currentPlan: text.match(/current\s*plan:?\s*(\w+)/i)?.[1],
      };
    });

    console.log('Pricing Analysis:', JSON.stringify(pricingAnalysis, null, 2));
  });

  test('2.8 Usage Indicator', async ({ page }) => {
    await page.goto(`${SITE_URL}/home`);
    await page.waitForLoadState('networkidle');

    // Find usage indicator in header/sidebar
    const usageIndicator = page.locator('text=/\\d+%|usage|limit/i').first();
    if (await usageIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Highlight and screenshot
      await usageIndicator.evaluate(el => el.style.outline = '3px solid red');
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/11-usage-indicator.png`,
      });

      const usageText = await usageIndicator.textContent();
      console.log('Usage Indicator Text:', usageText);
    }

    // Open sidebar to see usage
    const hamburger = page.locator('button').filter({ has: page.locator('[class*="menu"]') }).first();
    if (await hamburger.isVisible().catch(() => false)) {
      await hamburger.click();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/12-sidebar-usage.png`,
      });
    }
  });

  test('2.9 Mobile Report View', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(`${SITE_URL}/home`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-mobile-dashboard.png`,
    });

    // Open a report on mobile
    const firstReport = page.locator('a[href*="/reports/"]').first();
    if (await firstReport.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstReport.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/14-mobile-report-view.png`,
      });

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/15-mobile-report-full.png`,
        fullPage: true
      });
    }
  });
});
