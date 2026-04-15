import { defineConfig, devices } from '@playwright/test';

/**
 * LogiTrans E2E Test Configuration (Playwright)
 *
 * Targets the running Docker environment:
 *   Frontend: http://localhost:3000
 *   API:      http://localhost:3006
 *
 * Make sure Docker Compose is up before running:
 *   docker-compose up -d
 *
 * Run all tests:    npm test
 * Run headed:       npm run test:headed
 * Interactive UI:   npm run test:ui
 * Debug a test:     npm run test:debug
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 3,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
