import { defineConfig, devices } from '@playwright/test';

// Isolated stack: a fresh mock API on :4199 and each portal on a test port proxying to it,
// so e2e runs never touch the dev database.
const API = 'http://localhost:4199';
const app = (name: string, port: number) => ({
  command: `npx vite --port ${port} --strictPort`,
  cwd: `apps/${name}`,
  url: `http://localhost:${port}`,
  env: { SLATE_API_ORIGIN: API },
  reuseExistingServer: false,
  timeout: 60_000
});

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { trace: 'retain-on-failure', ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
  webServer: [
    { command: 'npx tsx src/server.ts --fresh', cwd: 'packages/mock-server', url: `${API}/api/demo-accounts`, env: { SLATE_API_PORT: '4199' }, reuseExistingServer: false },
    app('advertiser', 6173),
    app('sac', 6174),
    app('admin', 6175)
  ]
});
