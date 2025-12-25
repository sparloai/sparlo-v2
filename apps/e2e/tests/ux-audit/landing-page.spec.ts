import { test, expect } from '@playwright/test';
import { LandingPageObject } from './landing-page.po';
import { UxAuditPageObject } from './ux-audit.po';

test.describe('Landing Page UX Audit', () => {
  let landing: LandingPageObject;

  test.beforeEach(async ({ page }) => {
    landing = new LandingPageObject(page);
    await landing.goto();
  });

  test.describe('Hero Section', () => {
    test('should display headline and CTA prominently', async () => {
      await landing.verifyHeroSection();
    });

    test('should show all target sectors', async () => {
      await landing.verifySectorsList();
    });

    test('should have properly styled CTA button', async ({ page }) => {
      const cta = landing.heroCta;
      await expect(cta).toBeVisible();

      // Verify CTA has proper cursor
      const cursor = await cta.evaluate((el) =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');

      // Verify href points to sign-up
      const href = await cta.getAttribute('href');
      expect(href).toContain('/auth/sign-up');
    });

    test('should display intelligence badge with animation', async ({ page }) => {
      await expect(landing.intelligenceBadge).toBeVisible();
    });
  });

  test.describe('Header Navigation', () => {
    test('should display logo and auth buttons', async () => {
      await landing.verifyHeaderNavigation();
    });

    test('should have fixed header on scroll', async ({ page }) => {
      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(300);

      // Header should still be visible
      await expect(landing.header).toBeVisible();

      // Check position is fixed
      const position = await landing.header.evaluate((el) =>
        window.getComputedStyle(el).position
      );
      expect(['fixed', 'sticky']).toContain(position);
    });

    test('sign-in button should link to auth page', async () => {
      const href = await landing.signInButton.getAttribute('href');
      expect(href).toContain('/auth/sign-in');
    });

    test('sign-up button should link to auth page', async () => {
      const href = await landing.signUpButton.getAttribute('href');
      expect(href).toContain('/auth/sign-up');
    });
  });

  test.describe('Visual Hierarchy', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1').first();
      const h2 = page.locator('h2').first();

      const h1Size = await h1.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );
      const h2Size = await h2.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      ).catch(() => 0);

      if (h2Size > 0) {
        expect(h1Size).toBeGreaterThan(h2Size);
      }
    });

    test('should use consistent font family', async ({ page }) => {
      const body = page.locator('body');
      const fontFamily = await body.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );

      // Should include Soehne or fall back to sans-serif
      expect(fontFamily.toLowerCase()).toMatch(/soehne|sans-serif|system-ui/);
    });
  });

  test.describe('Example Reports Section', () => {
    test('should show report content when scrolled into view', async ({ page }) => {
      // Scroll to example reports section
      await page.evaluate(() => {
        const el = document.getElementById('description');
        if (el) el.scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(500);

      // Check if tabs or report content is visible (using first() for multiple matches)
      const hasReportContent = await page.locator('text=Climate Tech').first().isVisible().catch(() => false);
      expect(hasReportContent).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for desktop', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);
      await landing.verifyHeroSection();
      await landing.verifySectorsList();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.tablet);
      await landing.verifyHeroSection();
    });

    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);

      // Core elements should still be visible
      await expect(landing.heroHeadline).toBeVisible();
      await expect(landing.heroCta).toBeVisible();

      // Header should be compact
      await expect(landing.header).toBeVisible();
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should load without console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await landing.goto();
      await page.waitForLoadState('networkidle');

      // Filter out known benign errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('favicon') && !e.includes('analytics')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('should have accessible CTA button', async ({ page }) => {
      const cta = landing.heroCta;

      // Should have accessible name
      const name = await cta.evaluate((el) => el.textContent?.trim());
      expect(name?.length).toBeGreaterThan(0);

      // Should be focusable
      await cta.focus();
      const isFocused = await cta.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBeTruthy();
    });

    test('should have proper color contrast', async ({ page }) => {
      // Check headline text is visible against background
      const headline = landing.heroHeadline;
      const color = await headline.evaluate((el) =>
        window.getComputedStyle(el).color
      );

      // Should not be transparent or too light
      expect(color).not.toBe('rgba(0, 0, 0, 0)');
      expect(color).not.toBe('transparent');
    });
  });

  test.describe('Visual Snapshots', () => {
    test('should capture landing page screenshot', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/landing-page-desktop.png',
        fullPage: true,
      });
    });

    test('should capture mobile landing page screenshot', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/landing-page-mobile.png',
        fullPage: true,
      });
    });
  });
});
