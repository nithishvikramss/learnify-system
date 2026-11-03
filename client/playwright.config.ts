import { defineConfig } from '@playwright/test';

/**
 * UI workflow tests. They run the real React app (Vite dev server) in Microsoft Edge.
 * The backend API is simulated per test with page.route() (see tests/e2e/fake-api.ts),
 * so no database is needed.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../docs/test-evidence/playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'msedge',          // uses the installed Edge browser; no browser download needed
    headless: true,
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  outputDir: '../docs/test-evidence/playwright-results',
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
