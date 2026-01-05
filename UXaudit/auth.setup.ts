import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication Setup
 * 
 * This runs once before all tests to establish authenticated state.
 * The auth state is saved to .auth/user.json and reused by all tests.
 * 
 * To re-authenticate, delete .auth/user.json and run tests again.
 */

const authFile = path.join(__dirname, '../../.auth/user.json');

// Load credentials from environment or use defaults
const TEST_EMAIL = process.env.TEST_EMAIL || 'swimakaswim@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Linguine2025';

setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"], input[name="email"]', { 
    state: 'visible',
    timeout: 10000 
  });
  
  // Fill in credentials
  // Try common selectors for email input
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  await emailInput.fill(TEST_EMAIL);
  
  // Fill in password
  const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
  await passwordInput.fill(TEST_PASSWORD);
  
  // Submit the form
  // Try common submit button patterns
  const submitButton = page.locator(
    'button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")'
  ).first();
  await submitButton.click();
  
  // Wait for navigation to dashboard or home after login
  await page.waitForURL(/\/(dashboard|home|app|reports)?/, { timeout: 15000 });
  
  // Verify we're logged in by checking for common authenticated elements
  // Adjust these selectors based on your actual UI
  await expect(
    page.locator('[data-testid="user-menu"], [data-testid="avatar"], .user-avatar, nav').first()
  ).toBeVisible({ timeout: 10000 });
  
  // Save the authenticated state
  await page.context().storageState({ path: authFile });
  
  console.log('✓ Authentication successful, state saved to .auth/user.json');
});
