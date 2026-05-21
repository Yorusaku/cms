import { defineConfig, devices } from "@playwright/test";

const useSystemBrowser = process.env.PLAYWRIGHT_USE_SYSTEM_BROWSER !== "0";
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  timeout: 30000,
  expect: { timeout: 10000 },

  use: {
    baseURL: "http://127.0.0.1:3011/cms-manage",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: useSystemBrowser ? `system-${browserChannel}` : "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(useSystemBrowser ? { channel: browserChannel as "chrome" | "msedge" } : {}),
      },
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
