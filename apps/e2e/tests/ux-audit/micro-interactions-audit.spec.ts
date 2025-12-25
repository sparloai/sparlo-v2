import { test, expect, Page } from '@playwright/test';

const SITE_URL = 'https://sparlo.ai';
const SCREENSHOT_DIR = 'tests/ux-audit/screenshots/micro-interactions';
const TEST_EMAIL = 'swimakaswim@gmail.com';
const TEST_PASSWORD = 'Linguine2025';

/**
 * Micro-Interactions Audit
 *
 * Psychological Premium Signals:
 * - Hover states that feel responsive and intentional
 * - Animations that are smooth, not jarring
 * - Loading states that reduce anxiety
 * - Feedback loops that confirm user actions
 * - Transitions that feel "expensive" (ease curves, timing)
 */

test.describe('Micro-Interactions Audit: Premium Signal Analysis', () => {

  test('1. Hero Section - Hover States & Animations', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot initial state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-hero-initial.png`,
    });

    // Test CTA button hover
    const ctaButton = page.locator('a[href="/auth/sign-up"]').first();
    await ctaButton.hover();
    await page.waitForTimeout(300); // Let transition complete
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02-cta-hover.png`,
    });

    // Analyze CTA transition properties
    const ctaStyles = await ctaButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        transition: computed.transition,
        boxShadow: computed.boxShadow,
        transform: computed.transform,
        cursor: computed.cursor,
      };
    });
    console.log('CTA Button Hover Styles:', JSON.stringify(ctaStyles, null, 2));

    // Test sector list hover
    const sectorItems = page.locator('.group').filter({ hasText: /Climate Tech|Energy|Biotech/ });
    const firstSector = sectorItems.first();
    if (await firstSector.isVisible().catch(() => false)) {
      await firstSector.hover();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-sector-hover.png`,
      });
    }

    // Test scroll indicator hover
    const scrollIndicator = page.locator('a[href="#description"]');
    if (await scrollIndicator.isVisible().catch(() => false)) {
      await scrollIndicator.hover();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-scroll-indicator-hover.png`,
      });
    }

    // Check for CSS animations
    const animations = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const animatedElements: { selector: string; animation: string; transition: string }[] = [];

      allElements.forEach((el, index) => {
        const style = window.getComputedStyle(el);
        if (style.animation !== 'none' || style.transition !== 'all 0s ease 0s') {
          const classes = el.className?.toString().split(' ').slice(0, 3).join('.') || `element-${index}`;
          animatedElements.push({
            selector: classes,
            animation: style.animationName !== 'none' ? style.animation : 'none',
            transition: style.transition !== 'all 0s ease 0s' ? style.transition : 'none',
          });
        }
      });

      return animatedElements.slice(0, 20); // Limit output
    });
    console.log('Animated Elements Found:', JSON.stringify(animations, null, 2));
  });

  test('2. Navigation & Header Interactions', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Find nav links
    const signInLink = page.locator('a:has-text("Sign In")').first();
    const tryItLink = page.locator('a:has-text("Try It")').first();

    // Test Sign In hover
    if (await signInLink.isVisible().catch(() => false)) {
      await signInLink.hover();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-signin-hover.png`,
      });

      const signInStyles = await signInLink.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          textDecoration: computed.textDecoration,
          transition: computed.transition,
        };
      });
      console.log('Sign In Hover Styles:', JSON.stringify(signInStyles, null, 2));
    }

    // Test Try It hover
    if (await tryItLink.isVisible().catch(() => false)) {
      await tryItLink.hover();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-tryit-hover.png`,
      });
    }
  });

  test('3. Report Cards - Dashboard Interactions', async ({ page }) => {
    // Login first
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Screenshot dashboard
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/07-dashboard-initial.png`,
    });

    // Find report cards
    const reportCards = page.locator('a[href*="/reports/"]');
    const cardCount = await reportCards.count();
    console.log(`Found ${cardCount} report cards`);

    if (cardCount > 0) {
      // Test first card hover
      const firstCard = reportCards.first();
      await firstCard.hover();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-report-card-hover.png`,
      });

      // Analyze card hover state
      const cardStyles = await firstCard.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          transform: computed.transform,
          boxShadow: computed.boxShadow,
          borderColor: computed.borderColor,
          transition: computed.transition,
          backgroundColor: computed.backgroundColor,
        };
      });
      console.log('Report Card Hover Styles:', JSON.stringify(cardStyles, null, 2));

      // Test second card for comparison
      if (cardCount > 1) {
        const secondCard = reportCards.nth(1);
        await secondCard.hover();
        await page.waitForTimeout(300);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/09-report-card-hover-2.png`,
        });
      }
    }
  });

  test('4. Form Interactions - New Report Page', async ({ page }) => {
    // Login
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });

    // Go to new report
    await page.goto(`${SITE_URL}/home/reports/new`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Screenshot empty form
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-form-empty.png`,
    });

    // Test textarea focus
    const textarea = page.locator('textarea').first();
    await textarea.focus();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-textarea-focused.png`,
    });

    // Analyze textarea focus styles
    const textareaFocusStyles = await textarea.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        borderColor: computed.borderColor,
        transition: computed.transition,
      };
    });
    console.log('Textarea Focus Styles:', JSON.stringify(textareaFocusStyles, null, 2));

    // Type some text to trigger context detection
    await textarea.fill('We need to reduce manufacturing costs by 40% while improving thermal efficiency for our industrial heat pump system.');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-form-context-detection.png`,
    });

    // Test attach button hover
    const attachButton = page.locator('button:has-text("Attach")');
    if (await attachButton.isVisible().catch(() => false)) {
      await attachButton.hover();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/13-attach-button-hover.png`,
      });
    }

    // Test submit button states
    const submitButton = page.locator('button:has-text("Run Analysis")');

    // Disabled state (need more text)
    await textarea.fill('Short');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/14-submit-disabled.png`,
    });

    // Enabled state
    await textarea.fill('We need to reduce manufacturing costs by 40% while improving thermal efficiency for our industrial heat pump system. The current system operates at 150°C but we need to push to 200°C without increasing energy consumption.');
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/15-submit-enabled.png`,
    });

    // Hover on enabled submit
    await submitButton.hover();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/16-submit-hover.png`,
    });

    const submitStyles = await submitButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        boxShadow: computed.boxShadow,
        transform: computed.transform,
        transition: computed.transition,
        cursor: computed.cursor,
      };
    });
    console.log('Submit Button Hover Styles:', JSON.stringify(submitStyles, null, 2));
  });

  test('5. Button Press & Active States', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Test button active/press state
    const ctaButton = page.locator('a[href="/auth/sign-up"]').first();

    // Simulate mousedown without releasing
    await ctaButton.hover();
    await page.mouse.down();
    await page.waitForTimeout(100);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/17-cta-active-pressed.png`,
    });
    await page.mouse.up();
  });

  test('6. Page Load & Transition Speed', async ({ page }) => {
    // Measure page load performance
    const startTime = Date.now();
    await page.goto(SITE_URL);
    await page.waitForLoadState('domcontentloaded');
    const domContentLoaded = Date.now() - startTime;

    await page.waitForLoadState('networkidle');
    const fullyLoaded = Date.now() - startTime;

    console.log('Page Load Timing:', {
      domContentLoaded: `${domContentLoaded}ms`,
      fullyLoaded: `${fullyLoaded}ms`,
    });

    // Check for loading skeletons or spinners
    const loadingElements = await page.evaluate(() => {
      const skeletons = document.querySelectorAll('[class*="skeleton"], [class*="loading"], [class*="spinner"]');
      return skeletons.length;
    });
    console.log('Loading Elements Found:', loadingElements);

    // Test navigation speed to sign-up
    const navStart = Date.now();
    await page.click('a[href="/auth/sign-up"]');
    await page.waitForLoadState('domcontentloaded');
    const navTime = Date.now() - navStart;
    console.log('Navigation to Sign-Up:', `${navTime}ms`);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/18-signup-page-load.png`,
    });
  });

  test('7. Sidebar & Navigation Animations', async ({ page }) => {
    // Login
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Check sidebar interactions
    const sidebarLinks = page.locator('nav a, aside a');
    const linkCount = await sidebarLinks.count();
    console.log(`Found ${linkCount} sidebar/nav links`);

    // Screenshot sidebar
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/19-sidebar-initial.png`,
    });

    // Test sidebar link hovers
    for (let i = 0; i < Math.min(3, linkCount); i++) {
      const link = sidebarLinks.nth(i);
      if (await link.isVisible().catch(() => false)) {
        await link.hover();
        await page.waitForTimeout(200);
      }
    }
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/20-sidebar-hover.png`,
    });

    // Test "New Analysis" button
    const newAnalysisBtn = page.locator('a:has-text("NEW ANALYSIS"), a:has-text("New Analysis")').first();
    if (await newAnalysisBtn.isVisible().catch(() => false)) {
      await newAnalysisBtn.hover();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/21-new-analysis-hover.png`,
      });

      const btnStyles = await newAnalysisBtn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          boxShadow: computed.boxShadow,
          transition: computed.transition,
        };
      });
      console.log('New Analysis Button Styles:', JSON.stringify(btnStyles, null, 2));
    }
  });

  test('8. Report View Interactions', async ({ page }) => {
    // Login
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Click first completed report
    const reportLinks = page.locator('a[href*="/reports/"]');
    const firstReport = reportLinks.first();

    if (await firstReport.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstReport.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `${SCREENSHOT_DIR}/22-report-view.png`,
      });

      // Test TOC link hovers
      const tocLinks = page.locator('nav a, [class*="toc"] a, [class*="sidebar"] a');
      const tocCount = await tocLinks.count();
      console.log(`Found ${tocCount} TOC links`);

      if (tocCount > 0) {
        for (let i = 0; i < Math.min(3, tocCount); i++) {
          const tocLink = tocLinks.nth(i);
          if (await tocLink.isVisible().catch(() => false)) {
            await tocLink.hover();
            await page.waitForTimeout(200);
          }
        }
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/23-toc-hover.png`,
        });
      }

      // Test export/share button hovers
      const exportBtn = page.locator('button:has-text("Export"), [class*="export"]').first();
      if (await exportBtn.isVisible().catch(() => false)) {
        await exportBtn.hover();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/24-export-hover.png`,
        });
      }

      const shareBtn = page.locator('button:has-text("Share"), [class*="share"]').first();
      if (await shareBtn.isVisible().catch(() => false)) {
        await shareBtn.hover();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/25-share-hover.png`,
        });
      }
    }
  });

  test('9. Mobile Touch Target Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/26-mobile-hero.png`,
    });

    // Analyze touch target sizes
    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      const smallTargets: { text: string; width: number; height: number }[] = [];

      buttons.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Minimum recommended touch target is 44x44px
        if (rect.width < 44 || rect.height < 44) {
          smallTargets.push({
            text: (el.textContent || '').trim().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      });

      return smallTargets.slice(0, 10);
    });
    console.log('Small Touch Targets (< 44px):', JSON.stringify(interactiveElements, null, 2));

    // Login and check mobile dashboard
    await page.goto(`${SITE_URL}/auth/sign-in`);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home**', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/27-mobile-dashboard.png`,
    });
  });

  test('10. Dark Mode Interaction Parity', async ({ page }) => {
    // Test dark mode if available
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Check if dark mode is active or can be toggled
    const isDarkMode = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ||
             document.body.classList.contains('dark') ||
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    console.log('Dark Mode Active:', isDarkMode);

    // Force dark mode via class
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/28-dark-mode-hero.png`,
    });

    // Test CTA in dark mode
    const ctaButton = page.locator('a[href="/auth/sign-up"]').first();
    await ctaButton.hover();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/29-dark-mode-cta-hover.png`,
    });

    // Check dark mode contrast
    const darkModeContrast = await page.evaluate(() => {
      const cta = document.querySelector('a[href="/auth/sign-up"]');
      if (!cta) return null;
      const computed = window.getComputedStyle(cta);
      return {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        boxShadow: computed.boxShadow,
      };
    });
    console.log('Dark Mode CTA Styles:', JSON.stringify(darkModeContrast, null, 2));
  });

  test('11. Scroll Behavior & Parallax', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Check scroll behavior setting
    const scrollBehavior = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).scrollBehavior;
    });
    console.log('Scroll Behavior:', scrollBehavior);

    // Scroll and capture
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/30-scroll-top.png`,
    });

    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/31-scroll-middle.png`,
    });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/32-scroll-bottom.png`,
    });
  });

  test('12. Focus States & Keyboard Navigation', async ({ page }) => {
    await page.goto(SITE_URL);
    await page.waitForLoadState('networkidle');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/33-focus-first.png`,
    });

    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/34-focus-second.png`,
    });

    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/35-focus-third.png`,
    });

    // Check focus ring visibility
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      if (!active) return null;
      const computed = window.getComputedStyle(active);
      return {
        tagName: active.tagName,
        text: (active.textContent || '').trim().slice(0, 30),
        outline: computed.outline,
        boxShadow: computed.boxShadow,
        outlineOffset: computed.outlineOffset,
      };
    });
    console.log('Focused Element Styles:', JSON.stringify(focusedElement, null, 2));
  });
});
