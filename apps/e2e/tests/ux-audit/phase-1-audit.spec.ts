import { test, expect, Page } from '@playwright/test';

const SITE_URL = 'https://sparlo.ai';
const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/phase1';

test.describe('Phase 1 Audit: Getting to Free Report', () => {

  test('1.1 Homepage - Above the Fold', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Above the fold screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-homepage-above-fold.png`,
    });

    // Full page screenshot
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-homepage-full.png`,
      fullPage: true
    });
  });

  test('1.2 Discover Navigation Structure', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Get all navigation links
    const navLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a, header a, [role="navigation"] a'));
      return links.map(a => ({
        text: a.textContent?.trim(),
        href: a.getAttribute('href')
      })).filter(l => l.text && l.href);
    });

    console.log('Navigation Links:', JSON.stringify(navLinks, null, 2));
  });

  test('1.3 Discover All Internal Pages', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Get all internal links
    const internalLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links
        .map(a => a.getAttribute('href'))
        .filter(href => href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#'))
        .filter((href, i, arr) => arr.indexOf(href) === i);
    });

    console.log('Internal Pages Found:', internalLinks);

    // Visit and screenshot key pages
    const pagesToVisit = internalLinks.slice(0, 10);
    for (const link of pagesToVisit) {
      try {
        const url = link.startsWith('/') ? `${SITE_URL}${link}` : `${SITE_URL}/${link}`;
        await page.goto(url, { timeout: 10000 });
        await page.waitForLoadState('domcontentloaded');

        const safeName = link.replace(/\//g, '-').replace(/^-/, '') || 'root';
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/page-${safeName}.png`,
          fullPage: true
        });
      } catch (e) {
        console.log(`Could not visit ${link}`);
      }
    }
  });

  test('1.4 Example Reports Section', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Scroll to example reports section
    await page.evaluate(() => {
      const viewExample = document.querySelector('text=/example|sample|report/i');
      if (viewExample) viewExample.scrollIntoView();
    });

    // Look for "View Example Reports" or similar
    const exampleLink = page.locator('text=/view example|example report|sample/i').first();
    if (await exampleLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exampleLink.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-example-reports-section.png`,
      });

      // Click to view examples
      await exampleLink.click();
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-example-reports-page.png`,
        fullPage: true
      });
    }

    // Also check for direct report links
    const reportLinks = await page.locator('a[href*="report"]').all();
    console.log(`Found ${reportLinks.length} report links`);
  });

  test('1.5 Individual Example Report', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Find and click on an example report
    // Try multiple selectors
    const selectors = [
      'a[href*="/reports/"]',
      'a[href*="/example"]',
      'text=/view report|read report/i',
    ];

    for (const selector of selectors) {
      const link = page.locator(selector).first();
      if (await link.isVisible({ timeout: 2000 }).catch(() => false)) {
        await link.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Screenshot report page
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/05-example-report-view.png`,
        });

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/06-example-report-full.png`,
          fullPage: true
        });

        // Check report structure
        const hasNav = await page.locator('nav, [class*="toc"], [class*="sidebar"], [class*="contents"]').count();
        const hasSections = await page.locator('h2, h3').count();
        const hasExport = await page.locator('text=/export|download|pdf/i').count();

        console.log('Report Structure:', { hasNav, hasSections, hasExport });
        break;
      }
    }
  });

  test('1.6 Path to Free Report - CTA Discovery', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Find primary CTA
    const ctaSelectors = [
      'text=/run analysis|start|try|free|get started/i',
      'button:has-text("Analysis")',
      'a:has-text("Analysis")',
      '[class*="cta"]',
      '[class*="primary"]'
    ];

    let ctaFound = false;
    for (const selector of ctaSelectors) {
      const cta = page.locator(selector).first();
      if (await cta.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await cta.textContent();
        const href = await cta.getAttribute('href');
        console.log('Primary CTA Found:', { text: text?.trim(), href });

        // Highlight and screenshot
        await cta.evaluate(el => el.style.outline = '3px solid red');
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/07-primary-cta-highlighted.png`,
        });

        // Click CTA
        await cta.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        await page.screenshot({
          path: `${SCREENSHOT_DIR}/08-after-cta-click.png`,
        });

        ctaFound = true;
        break;
      }
    }

    if (!ctaFound) {
      console.log('No primary CTA found - checking for auth buttons');
      const signIn = page.locator('text=/sign in|login/i').first();
      const tryIt = page.locator('text=/try it|sign up/i').first();

      if (await tryIt.isVisible().catch(() => false)) {
        await tryIt.click();
        await page.waitForLoadState('networkidle');
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/08-signup-page.png`,
        });
      }
    }
  });

  test('1.7 Authentication Flow', async ({ page }) => {
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-sign-in-page.png`,
    });

    // Check sign-up page
    await page.goto(`${SITE_URL}/auth/sign-up`);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-sign-up-page.png`,
    });
  });

  test('1.8 Problem Submission Form', async ({ page }) => {
    // Login first
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', 'swimakaswim@gmail.com');
    await page.fill('input[name="password"]', 'Linguine2025');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });

    // Navigate to new report
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-new-report-form-empty.png`,
    });

    // Analyze form structure
    const formAnalysis = await page.evaluate(() => {
      const textarea = document.querySelector('textarea');
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const labels = Array.from(document.querySelectorAll('label'));

      return {
        hasTextarea: !!textarea,
        textareaPlaceholder: textarea?.getAttribute('placeholder'),
        inputCount: inputs.length,
        buttonCount: buttons.length,
        buttonTexts: buttons.map(b => b.textContent?.trim()),
        hasGuidance: document.body.innerText.includes('example') ||
                     document.body.innerText.includes('tip') ||
                     document.body.innerText.includes('how to'),
        hasContextDetection: !!document.querySelector('[class*="context"]'),
      };
    });

    console.log('Form Analysis:', JSON.stringify(formAnalysis, null, 2));

    // Fill with example text and screenshot
    const textarea = page.locator('textarea').first();
    await textarea.fill('We need to develop a carbon capture system that can operate efficiently at temperatures above 150°C while reducing energy consumption by 40% compared to current amine-based solutions. The system must be compatible with existing industrial flue gas streams.');

    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-new-report-form-filled.png`,
    });
  });

  test('1.9 Mobile Homepage Experience', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/13-mobile-homepage.png`,
    });

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-mobile-homepage-full.png`,
      fullPage: true
    });
  });

  test('1.10 Footer and Trust Signals', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-footer-trust-signals.png`,
    });

    // Find trust indicators
    const trustSignals = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      return {
        hasSoc2: text.includes('soc2') || text.includes('soc 2'),
        hasPrivacy: text.includes('privacy') || text.includes('data'),
        hasSecurity: text.includes('security') || text.includes('secure'),
        hasTestimonials: text.includes('testimonial') || text.includes('review'),
        hasLogos: document.querySelectorAll('img[alt*="logo"], img[alt*="partner"]').length > 0,
      };
    });

    console.log('Trust Signals Found:', trustSignals);
  });
});
