import { test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots', 'help-center-audit');
const BASE_URL = 'https://sparlo.ai';

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

/**
 * Help Center UX/UI Audit - Live Site
 * Takes screenshots of each component state for design review
 */
test.describe('Help Center UI Audit - Live Site', () => {
  test.use({
    baseURL: BASE_URL,
  });

  test('audit help center - all tabs', async ({ page }) => {
    // Go to sign in page first
    await page.goto('/auth/sign-in');
    await page.waitForLoadState('networkidle');

    // Screenshot: Login page
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-login-page.png'),
      fullPage: true,
    });

    // Login with credentials - user will need to provide these
    // For now, let's prompt for login
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    if (await emailInput.isVisible()) {
      // Use environment variables or wait for manual input
      const email = process.env.TEST_EMAIL || '';
      const password = process.env.TEST_PASSWORD || '';

      if (email && password) {
        await emailInput.fill(email);
        await passwordInput.fill(password);

        const submitBtn = page.locator('button[type="submit"]');
        await submitBtn.click();

        // Wait for redirect after login
        await page.waitForURL('**/home**', { timeout: 30000 });
        await page.waitForLoadState('networkidle');

        // Screenshot: Home page after login
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '02-home-after-login.png'),
          fullPage: true,
        });

        // Find and click help link in sidebar
        const helpLink = page.locator('a[href*="/help"]').first();
        if (await helpLink.isVisible({ timeout: 5000 })) {
          await helpLink.click();
        } else {
          // Try to navigate to help page directly using URL from current page
          const currentUrl = page.url();
          const match = currentUrl.match(/\/home\/([^\/]+)/);
          if (match) {
            await page.goto(`${BASE_URL}/home/${match[1]}/help`);
          }
        }

        await page.waitForLoadState('networkidle');

        // Screenshot: Help Center - Chat Tab (default)
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '03-help-chat-tab.png'),
          fullPage: true,
        });

        // Type in chat input
        const chatInput = page.locator('input[placeholder*="question"], input[placeholder*="message"], input[placeholder*="Type"]').first();
        if (await chatInput.isVisible({ timeout: 3000 })) {
          await chatInput.fill('How do I create a new analysis?');
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '04-help-chat-with-input.png'),
            fullPage: true,
          });
        }

        // Click Submit Request tab
        const ticketTab = page.locator('button:has-text("Submit"), [role="tab"]:has-text("Submit"), button:has-text("Ticket")').first();
        if (await ticketTab.isVisible({ timeout: 3000 })) {
          await ticketTab.click();
          await page.waitForTimeout(500);
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '05-help-ticket-tab.png'),
            fullPage: true,
          });
        }

        // Click Documentation tab
        const docsTab = page.locator('button:has-text("Documentation"), [role="tab"]:has-text("Documentation"), button:has-text("Docs")').first();
        if (await docsTab.isVisible({ timeout: 3000 })) {
          await docsTab.click();
          await page.waitForTimeout(500);
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '06-help-docs-tab.png'),
            fullPage: true,
          });
        }

        // Mobile viewport
        await page.setViewportSize({ width: 375, height: 812 });
        await page.waitForTimeout(300);
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '07-help-mobile-view.png'),
          fullPage: true,
        });

      } else {
        console.log('\n⚠️  No credentials provided. Set TEST_EMAIL and TEST_PASSWORD environment variables.');
        console.log('Example: TEST_EMAIL=your@email.com TEST_PASSWORD=yourpass npx playwright test help-center-audit.spec.ts');
      }
    }

    console.log(`\n✅ Screenshots saved to: ${SCREENSHOTS_DIR}`);
    if (fs.existsSync(SCREENSHOTS_DIR)) {
      const files = fs.readdirSync(SCREENSHOTS_DIR);
      console.log('Files created:');
      files.forEach((file) => console.log(`  - ${file}`));
    }
  });
});
