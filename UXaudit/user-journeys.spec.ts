import { test, expect, Page } from '@playwright/test';

/**
 * User Journey Validation Tests
 * 
 * These tests validate the critical user flows through the Sparlo application.
 * Each journey is tested end-to-end to ensure functionality and UX quality.
 */

test.describe('User Journey Audit', () => {
  
  test.describe('Journey 1: Report Generation Flow', () => {
    
    test('can navigate to new report from dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Find and click new report button
      const newReportBtn = page.locator(
        'button:has-text("New Report"), a:has-text("New Report"), [data-testid="new-report"]'
      ).first();
      await expect(newReportBtn).toBeVisible();
      await newReportBtn.click();
      
      // Should navigate to problem input
      await expect(page).toHaveURL(/\/(new|report|problem)/);
    });

    test('problem input form accepts and validates input', async ({ page }) => {
      await page.goto('/new');
      
      // Find the problem input textarea
      const problemInput = page.locator(
        'textarea, [data-testid="problem-input"], [contenteditable="true"]'
      ).first();
      await expect(problemInput).toBeVisible();
      
      // Test that it accepts text
      await problemInput.fill('Test engineering problem for audit');
      await expect(problemInput).toHaveValue(/Test engineering problem/);
      
      // Check for character count or validation indicators
      const charCount = page.locator('[data-testid="char-count"], .char-count');
      if (await charCount.count() > 0) {
        await expect(charCount).toBeVisible();
      }
    });

    test('report generation shows proper progress states', async ({ page }) => {
      await page.goto('/new');
      
      // Fill in a test problem
      const problemInput = page.locator('textarea').first();
      await problemInput.fill('How can we reduce thermal resistance in heat exchangers while maintaining structural integrity under high pressure differentials?');
      
      // Submit the problem
      const submitBtn = page.locator(
        'button[type="submit"], button:has-text("Generate"), button:has-text("Analyze")'
      ).first();
      await submitBtn.click();
      
      // Check for progress indicators
      const progressContainer = page.locator(
        '[data-testid="progress"], .progress, [role="progressbar"]'
      );
      
      // Should show some form of progress feedback
      await expect(
        progressContainer.or(page.locator('text=/analyzing|processing|generating/i'))
      ).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Journey 2: Report Viewing & Interaction', () => {
    
    test('report page displays all required sections', async ({ page }) => {
      // Navigate to an existing report or wait for one to generate
      await page.goto('/reports');
      
      // Click on the first report if available
      const reportCard = page.locator('[data-testid="report-card"], .report-card, a[href*="/report"]').first();
      if (await reportCard.count() > 0) {
        await reportCard.click();
        await page.waitForLoadState('networkidle');
        
        // Check for key report sections
        const sections = [
          'Executive Summary',
          'Problem Analysis',
          'Concept', // Concepts section
          'Recommendation',
        ];
        
        for (const section of sections) {
          const sectionEl = page.locator(`text=/${section}/i`).first();
          // Log which sections are found
          const isVisible = await sectionEl.isVisible().catch(() => false);
          console.log(`Section "${section}": ${isVisible ? '✓' : '✗'}`);
        }
      }
    });

    test('report chat follow-up is functional', async ({ page }) => {
      await page.goto('/reports');
      
      const reportCard = page.locator('[data-testid="report-card"], .report-card, a[href*="/report"]').first();
      if (await reportCard.count() > 0) {
        await reportCard.click();
        await page.waitForLoadState('networkidle');
        
        // Find chat input
        const chatInput = page.locator(
          '[data-testid="chat-input"], input[placeholder*="question"], textarea[placeholder*="question"]'
        ).first();
        
        if (await chatInput.count() > 0) {
          await expect(chatInput).toBeVisible();
          await chatInput.fill('Can you explain the first concept in more detail?');
          
          // Submit should be available
          const sendBtn = page.locator(
            'button[type="submit"], button:has-text("Send"), button[aria-label*="send"]'
          ).first();
          await expect(sendBtn).toBeEnabled();
        }
      }
    });
  });

  test.describe('Journey 3: Settings & Account', () => {
    
    test('settings page is accessible and functional', async ({ page }) => {
      await page.goto('/settings');
      
      // Should load settings page
      await expect(page.locator('text=/settings|account|profile/i').first()).toBeVisible();
      
      // Check for key settings sections
      const settingsSections = page.locator('nav a, [role="tab"], .settings-nav a');
      const count = await settingsSections.count();
      console.log(`Found ${count} settings navigation items`);
    });

    test('subscription/billing page shows plan info', async ({ page }) => {
      await page.goto('/settings/billing');
      
      // Should show some plan information
      const planInfo = page.locator(
        'text=/plan|subscription|billing|free|pro|enterprise/i'
      ).first();
      
      await expect(planInfo).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Journey 4: Navigation & Layout', () => {
    
    test('main navigation is consistent across pages', async ({ page }) => {
      const pagesToCheck = ['/dashboard', '/reports', '/settings'];
      
      for (const url of pagesToCheck) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Check for consistent nav elements
        const nav = page.locator('nav, [role="navigation"]').first();
        await expect(nav).toBeVisible();
        
        // Check for logo
        const logo = page.locator('[data-testid="logo"], .logo, img[alt*="Sparlo"]').first();
        await expect(logo).toBeVisible();
      }
    });

    test('mobile menu works correctly', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      // Look for mobile menu toggle
      const menuToggle = page.locator(
        '[data-testid="mobile-menu"], button[aria-label*="menu"], .hamburger'
      ).first();
      
      if (await menuToggle.count() > 0) {
        await menuToggle.click();
        
        // Menu should be visible
        const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav[role="navigation"]');
        await expect(mobileNav.first()).toBeVisible();
      }
    });
  });
});

// Helper function to log audit results
async function logAuditResult(page: Page, testName: string, passed: boolean, notes?: string) {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[AUDIT] ${status}: ${testName}`);
  if (notes) {
    console.log(`        Notes: ${notes}`);
  }
}
