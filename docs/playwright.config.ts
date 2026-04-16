import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: {
          width: 1440,
          height: 1200,
        },
      },
    },
  ],
  webServer: {
    command: '../node_modules/.bin/next start --hostname 127.0.0.1 --port 3000',
    port: 3000,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
