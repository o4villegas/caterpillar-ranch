/**
 * Playwright Test Configuration
 *
 * Comprehensive E2E testing for Caterpillar Ranch
 * - Multi-viewport testing (mobile, tablet, desktop)
 * - Visual regression with screenshots
 * - API response validation
 * - Performance metrics (Core Web Vitals)
 * - Environment-agnostic (local dev + production)
 */

import { defineConfig, devices } from '@playwright/test';

// Environment configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const IS_PRODUCTION = BASE_URL.includes('workers.dev');

export default defineConfig({
  testDir: './tests/e2e',

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: IS_PRODUCTION ? 2 : 0, // Retry production tests (network flakiness)
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],

  // Output directories
  outputDir: 'test-results/artifacts',

  use: {
    // Base URL for all tests
    baseURL: BASE_URL,

    // Collect trace on failure for debugging
    trace: 'retain-on-failure',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure (helps debug visual issues)
    video: 'retain-on-failure',

    // Network HAR recording (for API validation)
    recordHar: {
      path: 'test-results/network.har',
      mode: 'minimal',
    },

    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Test projects (multiple viewports + browsers)
  projects: [
    // Desktop - Chromium (primary)
    {
      name: 'desktop-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Desktop - Firefox
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Desktop - WebKit (Safari)
    {
      name: 'desktop-webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Tablet - iPad Pro
    {
      name: 'tablet-ipad',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
      },
    },

    // Mobile - iPhone 12 Pro
    {
      name: 'mobile-iphone',
      use: {
        ...devices['iPhone 12 Pro'],
        viewport: { width: 390, height: 844 },
      },
    },

    // Mobile - Pixel 5
    {
      name: 'mobile-android',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
    },
  ],

  // Local dev server (only start if testing locally)
  webServer: IS_PRODUCTION ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for build
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
