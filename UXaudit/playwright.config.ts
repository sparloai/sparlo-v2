import { defineConfig, devices } from '@playwright/test';

/**
 * Sparlo E2E Test Configuration
 * 
 * Auth state is persisted to .auth/user.json after initial login.
 * Run `npx playwright test auth.setup.ts` to generate auth state.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report' }],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL for your app */
    baseURL: process.env.BASE_URL || 'https://sparlo.ai',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - runs first to authenticate
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    
    // Main test project - uses authenticated state
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Mobile viewport
    {
      name: 'mobile',
      use: { 
        ...devices['iPhone 14'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Tablet viewport
    {
      name: 'tablet',
      use: { 
        ...devices['iPad Pro 11'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  /* Output folder for test artifacts */
  outputDir: 'test-results/',
  
  /* Global timeout */
  timeout: 60000,
  
  /* Expect timeout */
  expect: {
    timeout: 10000,
  },
});
