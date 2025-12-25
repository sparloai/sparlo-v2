import { test, expect } from '@playwright/test';
import { ReportsListPageObject } from './reports-list.po';
import { UxAuditPageObject } from './ux-audit.po';

// Use fresh session - we login with our own credentials
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_CREDENTIALS = {
  email: 'swimakaswim@gmail.com',
  password: 'Linguine2025',
};

test.describe('Reports List UX Audit', () => {
  let reportsList: ReportsListPageObject;

  test.beforeEach(async ({ page }) => {
    reportsList = new ReportsListPageObject(page);
    await reportsList.loginAndGoto(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password);
  });

  test.describe('List Layout', () => {
    test('should display reports header', async () => {
      await reportsList.verifyListLayout();
    });

    test('should display new analysis button', async () => {
      await reportsList.verifyNewAnalysisButton();
    });

    test('should have search input', async () => {
      await reportsList.verifySearchInput();
    });
  });

  test.describe('Report Cards', () => {
    test('should display report cards or empty state', async () => {
      await reportsList.verifyReportCardStructure();
    });

    test('should have status indicators', async () => {
      await reportsList.verifyStatusIndicators();
    });

    test('cards should be clickable', async ({ page }) => {
      const cardCount = await reportsList.reportCards.count();

      if (cardCount > 0) {
        const firstCard = reportsList.reportCards.first();
        const cursor = await firstCard.evaluate((el) =>
          window.getComputedStyle(el).cursor
        );
        expect(cursor).toBe('pointer');
      }
    });

    test('cards should have proper spacing', async ({ page }) => {
      const cardCount = await reportsList.reportCards.count();

      if (cardCount >= 2) {
        const firstBox = await reportsList.reportCards.nth(0).boundingBox();
        const secondBox = await reportsList.reportCards.nth(1).boundingBox();

        if (firstBox && secondBox) {
          const gap = secondBox.y - (firstBox.y + firstBox.height);
          expect(gap).toBeGreaterThan(0); // Should have some spacing
        }
      }
    });
  });

  test.describe('Search Functionality', () => {
    test('search input should be focusable', async ({ page }) => {
      await reportsList.searchInput.focus();
      const isFocused = await reportsList.searchInput.evaluate(
        (el) => el === document.activeElement
      );
      expect(isFocused).toBeTruthy();
    });

    test('search input should accept text', async ({ page }) => {
      await reportsList.searchInput.fill('test search');
      const value = await reportsList.searchInput.inputValue();
      expect(value).toBe('test search');
    });

    test('search should have proper styling', async ({ page }) => {
      await reportsList.verifyInputStyling(reportsList.searchInput);
    });
  });

  test.describe('New Analysis Button', () => {
    test('should link to new report page', async ({ page }) => {
      const href = await reportsList.newAnalysisButton.getAttribute('href');
      expect(href).toContain('/new');
    });

    test('should have proper button styling', async ({ page }) => {
      const cursor = await reportsList.newAnalysisButton.evaluate((el) =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('pointer');
    });

    test('should navigate on click', async ({ page }) => {
      await reportsList.newAnalysisButton.click();
      await page.waitForURL('**/new**', { timeout: 10000 });
      expect(page.url()).toContain('/new');
    });
  });

  test.describe('Visual Consistency', () => {
    test('should use consistent typography', async ({ page }) => {
      const fontFamily = await reportsList.reportsHeader.evaluate((el) =>
        window.getComputedStyle(el).fontFamily
      );
      expect(fontFamily.toLowerCase()).toMatch(/soehne|sans-serif|system-ui/);
    });

    test('header should have proper size', async ({ page }) => {
      const fontSize = await reportsList.reportsHeader.evaluate((el) =>
        parseFloat(window.getComputedStyle(el).fontSize)
      );
      expect(fontSize).toBeGreaterThan(16);
    });

    test('should have consistent card styling', async ({ page }) => {
      const cardCount = await reportsList.reportCards.count();

      if (cardCount >= 2) {
        const firstBorderRadius = await reportsList.reportCards.nth(0).evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );
        const secondBorderRadius = await reportsList.reportCards.nth(1).evaluate((el) =>
          window.getComputedStyle(el).borderRadius
        );

        expect(firstBorderRadius).toBe(secondBorderRadius);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on desktop', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.desktop);
      await reportsList.verifyListLayout();
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.tablet);
      await expect(reportsList.reportsHeader).toBeVisible();
      await expect(reportsList.newAnalysisButton).toBeVisible();
    });

    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await expect(reportsList.reportsHeader).toBeVisible();
      await expect(reportsList.newAnalysisButton).toBeVisible();
    });

    test('cards should be full width on mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);

      const cardCount = await reportsList.reportCards.count();
      if (cardCount > 0) {
        const cardBox = await reportsList.reportCards.first().boundingBox();
        const viewportWidth = page.viewportSize()?.width || 375;

        if (cardBox) {
          // Card should take up most of the width
          expect(cardBox.width).toBeGreaterThan(viewportWidth * 0.8);
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3').all();
      expect(headings.length).toBeGreaterThan(0);
    });

    test('new analysis button should be keyboard accessible', async ({ page }) => {
      await reportsList.newAnalysisButton.focus();
      const isFocused = await reportsList.newAnalysisButton.evaluate(
        (el) => el === document.activeElement
      );
      expect(isFocused).toBeTruthy();
    });

    test('search input should have label or placeholder', async ({ page }) => {
      const placeholder = await reportsList.searchInput.getAttribute('placeholder');
      const ariaLabel = await reportsList.searchInput.getAttribute('aria-label');

      expect(placeholder || ariaLabel).toBeTruthy();
    });
  });

  test.describe('Empty State', () => {
    test('should show empty state or reports', async ({ page }) => {
      const cardCount = await reportsList.reportCards.count();
      const emptyVisible = await reportsList.emptyState.isVisible().catch(() => false);

      // Either we have reports or empty state
      expect(cardCount > 0 || emptyVisible).toBeTruthy();
    });
  });

  test.describe('Visual Snapshots', () => {
    test('should capture reports list desktop', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/reports-list-desktop.png',
        fullPage: true,
      });
    });

    test('should capture reports list mobile', async ({ page }) => {
      await page.setViewportSize(UxAuditPageObject.VIEWPORTS.mobile);
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: 'tests/ux-audit/baselines/reports-list-mobile.png',
        fullPage: true,
      });
    });
  });
});
