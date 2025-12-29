import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Brand Audit: Reports Page Screenshots - Light Mode
 */

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots-light');
const CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Reports Page Brand Audit - Light Mode', () => {
  test('capture reports page - desktop light', async ({ page, context }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Set light mode cookie before navigating
    await context.addCookies([
      {
        name: 'theme',
        value: 'light',
        domain: 'sparlo.ai',
        path: '/',
      },
    ]);

    // Login
    await page.goto('/auth/sign-in', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.fill('input[name="email"], input[type="email"]', CREDENTIALS.email);
    await page.fill('input[name="password"], input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForSelector('text=REPORTS', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click on a report
    const reportRow = page.locator('text=High-Performance Retrofit Insulation').first();
    await reportRow.click();

    // Wait for report to load
    await page.waitForTimeout(5000);

    // Capture full page
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-full-page-desktop.png'),
      fullPage: true,
    });

    // Capture above-the-fold
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-above-fold-desktop.png'),
      fullPage: false,
    });

    // Scroll and capture sections
    const scrollPositions = [
      { name: 'section-1', scroll: 900 },
      { name: 'section-2', scroll: 1800 },
      { name: 'section-3', scroll: 2700 },
      { name: 'section-4', scroll: 3600 },
      { name: 'section-5', scroll: 4500 },
      { name: 'section-6', scroll: 5400 },
      { name: 'section-7', scroll: 6300 },
      { name: 'section-8', scroll: 7200 },
      { name: 'section-9', scroll: 8100 },
      { name: 'section-10', scroll: 9000 },
    ];

    for (const section of scrollPositions) {
      await page.evaluate((y) => window.scrollTo(0, y), section.scroll);
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `report-${section.name}.png`),
        fullPage: false,
      });
    }

    // Bottom of page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-bottom.png'),
      fullPage: false,
    });
  });

  test('capture reports page - mobile light', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Set light mode cookie before navigating
    await context.addCookies([
      {
        name: 'theme',
        value: 'light',
        domain: 'sparlo.ai',
        path: '/',
      },
    ]);

    // Login
    await page.goto('/auth/sign-in', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.fill('input[name="email"], input[type="email"]', CREDENTIALS.email);
    await page.fill('input[name="password"], input[type="password"]', CREDENTIALS.password);
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=REPORTS', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click on a report
    const reportRow = page.locator('text=High-Performance Retrofit Insulation').first();
    await reportRow.click();
    await page.waitForTimeout(5000);

    // Capture mobile views
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-full-page-mobile.png'),
      fullPage: true,
    });

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'report-above-fold-mobile.png'),
      fullPage: false,
    });
  });
});
