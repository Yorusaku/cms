import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: "http://127.0.0.1:3011/cms-manage/",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: [
    {
      command: "pnpm --filter @cms/cms dev",
      port: 3011,
      timeout: 60000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
