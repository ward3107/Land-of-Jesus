import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E config. The smoke suite is offline-safe: it exercises public pages and the
 * unauthenticated → /login redirect, which need no Supabase backend. Full
 * authenticated flows run against a seeded Supabase project (Phase B+ CI).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line']] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Allow pointing at a preinstalled Chromium (e.g. sandboxed CI images).
        // Unset → Playwright uses its bundled browser (`npx playwright install`).
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
