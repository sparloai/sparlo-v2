import { defineConfig, devices } from '@playwright/test';

/**
 * Standalone Playwright config for UX audits
 * Runs against production without setup dependencies
 */
export default defineConfig({
  testDir: './tests/sparlo',
  testMatch: '**/ux-audit.spec.ts',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'ux-audit-report' }]],
  use: {
    baseURL: 'https://sparlo.ai',
    screenshot: 'on',
    trace: 'on',
    video: 'on',
    navigationTimeout: 30000,
  },
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
