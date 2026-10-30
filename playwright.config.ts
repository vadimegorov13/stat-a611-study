import { defineConfig } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';

// Throwaway user data so tests never touch your real notes or progress.
export const E2E_DATA = path.join(os.tmpdir(), 'stat611-e2e-user-data');
const PORT = 4700;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure' },
  webServer: {
    command: `rm -rf "${E2E_DATA}" && npx vite build --logLevel warn && STUDY_USER_DATA="${E2E_DATA}" STUDY_APP_PORT=${PORT} NODE_ENV=production npx tsx server/index.ts`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
