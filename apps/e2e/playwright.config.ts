import { defineConfig, devices } from '@playwright/test';
import { SESSION_FILE } from './support/session';

// Runs against the full stack (docker compose up). Override to target another environment.
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:8080';
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  // One worker: every spec shares the same database, and login is rate limited (5/min).
  workers: 1,
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    locale: 'es-CL',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Logs in once and stores the session, so specs do not burn the login rate limit.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: SESSION_FILE },
      dependencies: ['setup'],
    },
  ],
});
