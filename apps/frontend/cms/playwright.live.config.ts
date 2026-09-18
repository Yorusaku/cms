import { defineConfig, devices } from "@playwright/test";

/**
 * 真实链路 E2E 配置（独立于既有 mock 套件 tests/e2e）。
 * 链路：真实 backend(3300) + CRS(3010) + CMS(3011)，数据库使用独立测试库 cms_platform_resume_e2e。
 * 运行：pnpm --filter @cms/cms test:e2e:live
 *
 * 说明：
 * - backend 由 globalSetup 重建测试库并迁移/seed，webServer 注入 DB_DATABASE 指向测试库，
 *   保证业务库零污染；因此 backend 不启用 reuseExistingServer（旧进程 env 不符会导致串库）。
 * - AI 建页注入 AI_MOCK_ENABLED=true 走后端本地 mock，不依赖外部模型服务。
 */
const useSystemBrowser = process.env.PLAYWRIGHT_USE_SYSTEM_BROWSER !== "0";
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome";

export default defineConfig({
  testDir: "./tests/e2e-live",
  // 真实链路共享同一后端与数据库，串行执行避免相互干扰
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["html"], ["list"]],
  timeout: 180000,
  expect: { timeout: 20000 },
  globalSetup: "./tests/e2e-live/global-setup.cjs",

  use: {
    baseURL: "http://127.0.0.1:3011/cms-manage",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: useSystemBrowser ? `system-${browserChannel}` : "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(useSystemBrowser
          ? { channel: browserChannel as "chrome" | "msedge" }
          : {}),
      },
    },
  ],

  webServer: [
    {
      // backend 必须从 dist 启动（main.ts 用 __dirname 定位 uploads 目录）
      name: "backend",
      command: "node dist/main",
      cwd: "../../../apps/backend",
      env: {
        DB_DATABASE: "cms_platform_resume_e2e",
        AI_MOCK_ENABLED: "true",
      },
      // 探测：seed 后 id=1 为已发布演示页，getPublishedPage 返回 200
      url: "http://127.0.0.1:3300/atlas-cms/getPublishedPage?id=1",
      timeout: 120000,
      // 故意不复用旧进程：旧进程 env 未指向测试库会污染业务库
      reuseExistingServer: false,
    },
    {
      name: "crs",
      command: "pnpm --filter @cms/crs dev",
      port: 3010,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
    {
      name: "cms",
      command: "pnpm --filter @cms/cms dev",
      port: 3011,
      timeout: 120000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});