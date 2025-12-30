import { expect, test } from '@playwright/test';

import { AuthPageObject } from './authentication/auth.po';
import { AUTH_STATES } from './utils/auth-state';

test.describe('Docs App Sidebar', () => {
  test.describe('when logged in', () => {
    AuthPageObject.setupSession(AUTH_STATES.TEST_USER);

    test('shows sidebar toggle button on docs page', async ({ page }) => {
      await page.goto('/docs');

      // Wait for the page to load
      await page.waitForLoadState('networkidle');

      // The sidebar toggle should be visible
      const toggleButton = page.getByTestId('docs-sidebar-toggle');
      await expect(toggleButton).toBeVisible();
    });

    test('opens sidebar panel when toggle is clicked', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // Click the toggle button
      const toggleButton = page.getByTestId('docs-sidebar-toggle');
      await toggleButton.click();

      // The sidebar panel should be visible
      const sidebarPanel = page.getByTestId('docs-sidebar-panel');
      await expect(sidebarPanel).toBeVisible();

      // Should contain expected navigation items
      await expect(sidebarPanel.getByText('New Analysis')).toBeVisible();
      await expect(sidebarPanel.getByText('All Reports')).toBeVisible();
      await expect(sidebarPanel.getByText('Settings')).toBeVisible();
      await expect(sidebarPanel.getByText('Billing')).toBeVisible();
      await expect(sidebarPanel.getByText('Log out')).toBeVisible();
    });

    test('closes sidebar when clicking outside', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // Open the sidebar
      const toggleButton = page.getByTestId('docs-sidebar-toggle');
      await toggleButton.click();

      const sidebarPanel = page.getByTestId('docs-sidebar-panel');
      await expect(sidebarPanel).toBeVisible();

      // Click outside (on the overlay)
      await page.mouse.click(500, 300);

      // Sidebar should be hidden (translated off-screen)
      await expect(sidebarPanel).toHaveClass(/-translate-x-full/);
    });

    test('closes sidebar when pressing Escape', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // Open the sidebar
      const toggleButton = page.getByTestId('docs-sidebar-toggle');
      await toggleButton.click();

      const sidebarPanel = page.getByTestId('docs-sidebar-panel');
      await expect(sidebarPanel).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Sidebar should be hidden
      await expect(sidebarPanel).toHaveClass(/-translate-x-full/);
    });

    test('navigates to New Analysis when clicked', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // Open the sidebar
      const toggleButton = page.getByTestId('docs-sidebar-toggle');
      await toggleButton.click();

      const sidebarPanel = page.getByTestId('docs-sidebar-panel');

      // Click New Analysis
      await sidebarPanel.getByText('New Analysis').click();

      // Should navigate to new analysis page
      await page.waitForURL('**/home/reports/new');
    });

    test('hides user dropdown in header when on docs page', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // The header nav right side should be hidden
      const headerNav = page.locator('header nav > div.hidden.md\\:flex');
      await expect(headerNav).toHaveCSS('visibility', 'hidden');
    });
  });

  test.describe('when logged out', () => {
    test('does not show sidebar toggle button', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // The sidebar toggle should not exist
      const toggleButton = page.getByTestId('docs-sidebar-toggle');
      await expect(toggleButton).not.toBeVisible();
    });

    test('shows sign in and get started buttons', async ({ page }) => {
      await page.goto('/docs');
      await page.waitForLoadState('networkidle');

      // The sign in and get started buttons should be visible
      await expect(page.getByText('Sign In')).toBeVisible();
      await expect(page.getByText('Get Started')).toBeVisible();
    });
  });
});
