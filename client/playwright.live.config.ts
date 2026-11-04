import { defineConfig } from '@playwright/test';

/**
 * LIVE UI tests: the real React app + the real Spring Boot backend + a real MongoDB.
 * Nothing is simulated. Start the backend first (cd server && ./mvnw spring-boot:run).
 * Credentials are read from server/.env by the tests (tests/live/env.ts) and never hard-coded.
 *
 *   npm run test:live
 */
export default defineConfig({
  testDir: './tests/live',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  // Console output only: HTML reports and traces record typed values, including real passwords.
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'msedge',
    headless: true,
    screenshot: 'only-on-failure',
  },
  outputDir: '../docs/test-evidence/playwright-live-results',
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
