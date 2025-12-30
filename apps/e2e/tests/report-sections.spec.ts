import { expect, test } from '@playwright/test';

// Skip auth setup - landing page doesn't require authentication
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Report Sections Test
 *
 * Quick verification that the BrandSystemReport renders correctly on the landing page.
 */

test('landing page example report renders sections', async ({ page }) => {
  // Go to landing page
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Scroll to example reports section
  const exampleReports = page.locator('#example-reports');
  await exampleReports.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  // The example report should render these sections
  const expectedSections = [
    'executive-summary',
    'problem-analysis',
    'constraints',
    'challenge-the-frame',
    'innovation-analysis',
    'solution-concepts',
    'innovation-concepts',
    'risks-watchouts',
    'self-critique',
    'final-recommendation',
  ];

  // Check that key sections exist
  for (const sectionId of expectedSections) {
    const section = page.locator(`#${sectionId}`);
    const count = await section.count();

    if (count === 0) {
      console.log(`Section #${sectionId} not found`);
    } else {
      console.log(`Section #${sectionId} found`);
    }
  }

  // Take screenshot for visual verification
  await page.screenshot({
    path: 'tests/report-sections-screenshots/example-report.png',
    fullPage: true,
  });

  // Verify at least the executive summary renders
  const execSummary = page.locator('#executive-summary');
  await expect(execSummary).toBeVisible({ timeout: 10000 });
});
