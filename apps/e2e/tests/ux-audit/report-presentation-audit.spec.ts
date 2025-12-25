import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SITE_URL = 'https://sparlo.ai';
const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/report-presentation-audit';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const fullPath = path.join(__dirname, '../../', SCREENSHOT_DIR);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

test.describe('Report Presentation Audit', () => {
  test('Capture comprehensive report screenshots for design review', async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1440, height: 900 });

    // === LOGIN ===
    console.log('Logging in...');
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
    await page.fill('input[name="password"]', 'Linguine2025');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 60000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: Dashboard (for context)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-dashboard-context.png`,
    });

    // === FIND AND OPEN A COMPLETED REPORT ===
    console.log('Looking for a completed report...');
    await page.waitForTimeout(2000);

    // The reports are displayed as cards/rows. Look for clickable elements containing [ANALYSIS] text
    // that don't have "PROCESSING" status
    const reportCards = page.locator('text=[ANALYSIS]').locator('..').locator('..');

    // Alternative: look for report rows that have dates (completed reports show dates like "DEC 24")
    const completedReports = page.locator(':has-text("DEC"):not(:has-text("PROCESSING"))');

    // Try clicking on a completed report - look for cards with specific completed report titles
    const reportTitles = [
      'Breaking the Cold Chain',
      'On-Site Food Waste Processing',
      'Transparent Wood at Scale',
      'EV Cold Chain',
      'Endosomal Escape Enhancement',
      'Multi-Mechanism Preservation',
    ];

    let reportOpened = false;

    for (const title of reportTitles) {
      const reportCard = page.locator(`text=${title}`).first();
      if (await reportCard.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Found report: ${title}`);

        // Click the card
        await reportCard.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Check if we navigated to a report page
        const currentUrl = page.url();
        if (currentUrl.includes('/reports/') && !currentUrl.includes('/new')) {
          reportOpened = true;
          console.log(`Successfully opened report: ${currentUrl}`);
          break;
        }
      }
    }

    // Alternative: try clicking the first row that doesn't have PROCESSING
    if (!reportOpened) {
      console.log('Trying alternative selector...');

      // Find rows by looking for date patterns (DEC 24, DEC 23, etc.)
      const rows = await page.locator('div:has-text("DEC")').all();
      console.log(`Found ${rows.length} potential report rows`);

      for (const row of rows.slice(0, 10)) {
        const text = await row.textContent();
        if (text && !text.includes('PROCESSING') && text.includes('[ANALYSIS]')) {
          console.log(`Clicking row: ${text.substring(0, 60)}...`);
          await row.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);

          const currentUrl = page.url();
          if (currentUrl.includes('/reports/') && !currentUrl.includes('/new')) {
            reportOpened = true;
            console.log(`Successfully opened report: ${currentUrl}`);
            break;
          }
        }
      }
    }

    if (!reportOpened) {
      // Take a debug screenshot
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/DEBUG-no-reports-found.png`,
        fullPage: true,
      });
      console.log('WARNING: Could not open a completed report. Capturing current page.');
    }

    // === CAPTURE REPORT SECTIONS ===

    // 1. Report Hero/Header
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-report-header.png`,
    });

    // 2. Full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/03-report-full-page.png`,
      fullPage: true,
    });

    // 3. Scroll incrementally and capture sections
    const scrollPositions = [
      { y: 0, name: '04-viewport-1-top' },
      { y: 500, name: '05-viewport-2-intro' },
      { y: 1000, name: '06-viewport-3-content' },
      { y: 1500, name: '07-viewport-4-mid' },
      { y: 2000, name: '08-viewport-5-detail' },
      { y: 2500, name: '09-viewport-6-deep' },
      { y: 3000, name: '10-viewport-7-further' },
      { y: 4000, name: '11-viewport-8-more' },
      { y: 5000, name: '12-viewport-9-extended' },
    ];

    for (const pos of scrollPositions) {
      await page.evaluate((y) => window.scrollTo(0, y), pos.y);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${pos.name}.png`,
      });
    }

    // 4. Capture specific UI elements if visible

    // Try to find and capture expandable sections
    const expandableButtons = page.locator('button[aria-expanded], details > summary, [data-state]');
    const expandCount = await expandableButtons.count();
    console.log(`Found ${expandCount} expandable elements`);

    if (expandCount > 0) {
      // Click first expandable to show interaction state
      await expandableButtons.first().click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/13-expanded-section.png`,
      });
    }

    // 5. Capture typography and component details
    // Scroll back to top for clean captures
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // Capture at different viewport widths for responsive check
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-report-desktop-large.png`,
      fullPage: true,
    });

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-report-tablet.png`,
      fullPage: true,
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-report-mobile.png`,
      fullPage: true,
    });

    // 6. Back to standard viewport for detail shots
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // Try to capture code blocks, tables, or other data-rich elements
    const codeBlocks = page.locator('pre, code, .code-block, [class*="code"]');
    const codeCount = await codeBlocks.count();
    if (codeCount > 0) {
      const firstCode = codeBlocks.first();
      await firstCode.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/17-code-block-detail.png`,
      });
    }

    // Capture tables if any
    const tables = page.locator('table, [class*="table"], [role="grid"]');
    const tableCount = await tables.count();
    if (tableCount > 0) {
      const firstTable = tables.first();
      await firstTable.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/18-table-detail.png`,
      });
    }

    // Capture lists/bullet points
    const lists = page.locator('ul:not([role]), ol, [class*="list"]');
    const listCount = await lists.count();
    if (listCount > 0) {
      // Find a substantial list
      for (let i = 0; i < Math.min(listCount, 5); i++) {
        const list = lists.nth(i);
        const items = await list.locator('li').count();
        if (items >= 3) {
          await list.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          await page.screenshot({
            path: `${SCREENSHOT_DIR}/19-list-detail.png`,
          });
          break;
        }
      }
    }

    // 7. Capture headings hierarchy
    const h1s = page.locator('h1');
    const h2s = page.locator('h2');
    const h3s = page.locator('h3');

    console.log(`Found: ${await h1s.count()} h1, ${await h2s.count()} h2, ${await h3s.count()} h3`);

    // Scroll to first major heading after title
    if ((await h2s.count()) > 0) {
      await h2s.first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/20-heading-hierarchy.png`,
      });
    }

    // 8. Final comprehensive scroll capturing every 800px
    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    console.log(`Total page height: ${totalHeight}px`);

    let scrollIndex = 21;
    for (let y = 0; y < totalHeight; y += 800) {
      if (scrollIndex > 40) break; // Limit screenshots
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${scrollIndex}-scroll-${y}px.png`,
      });
      scrollIndex++;
    }

    console.log(`Captured ${scrollIndex - 1} total screenshots`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  });
});
