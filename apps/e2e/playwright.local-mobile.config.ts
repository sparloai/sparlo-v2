import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for local mobile UX testing
 */
export default defineConfig({
  testDir: './tests/ux-audit',
  testMatch: 'mobile-report-reading.spec.ts',
  timeout: 120000,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'mobile-ux-report' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'on',
    trace: 'on',
    video: 'on-first-retry',
    testIdAttribute: 'data-test',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
});
