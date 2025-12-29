import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for UX/UI Audit tests
 * Runs against live deployment at sparlo.ai
 */
export default defineConfig({
  testDir: './tests/ux-audit',
  timeout: 120000,
  retries: 1,
  workers: 1, // Run sequentially to avoid rate limiting
  reporter: [
    ['html', { outputFolder: 'ux-audit-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'https://sparlo.ai',
    screenshot: 'on',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    testIdAttribute: 'data-test',
    // Slow down for visual testing
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 13'],
      },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['iPad (gen 7)'],
      },
    },
  ],
  // Output directory for screenshots and baselines
  outputDir: 'tests/ux-audit/test-results',
});
