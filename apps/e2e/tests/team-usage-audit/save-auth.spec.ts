/**
 * Step 1: Run this ONCE in headed mode to save your auth session
 *
 * Run: npx playwright test save-auth --project=ux-audit --headed
 *
 * This will open a browser - log in manually, then the test will save your session.
 */

import { test } from '@playwright/test';
import * as path from 'path';

const AUTH_FILE = path.join(__dirname, 'auth-state.json');

test('Save authentication state', async ({ page }) => {
  // Go to sign-in page
  await page.goto('/auth/sign-in');

  console.log('\n========================================');
  console.log('MANUAL LOGIN REQUIRED');
  console.log('========================================');
  console.log('1. Log in with your credentials in the browser');
  console.log('2. Wait until you see the dashboard');
  console.log('3. The test will automatically save your session');
  console.log('========================================\n');

  // Wait for user to manually log in and reach the home page
  await page.waitForURL('**/home**', { timeout: 120000 }); // 2 minutes to log in

  // Save the authentication state
  await page.context().storageState({ path: AUTH_FILE });

  console.log(`\n✅ Auth state saved to: ${AUTH_FILE}`);
  console.log('You can now run the full audit test!\n');
});
