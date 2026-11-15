import { defineConfig, devices } from '@playwright/test'

/**
 * 票据异常业务链路 E2E（专属配置，不动既有 live 套件）。
 *
 * 与 `playwright.live.config.ts` 的区别：
 * - 使用独立库 `cms_ticket_exception_e2e`，**不 drop、不重建**，已有数据沿用；
 * - globalSetup 只做「库不存在则创建 + 跑增量迁移」，不跑全量 seed；
 * - 覆盖模板建页 → 预览无写请求 → 审核发布 → CRS 登录登记 → 查询 → 要求补充 → 补充 → 解决 → 历史。
 *
 * 运行：pnpm --filter @cms/cms test:e2e:ticket
 */
const useSystemBrowser = process.env.PLAYWRIGHT_USE_SYSTEM_BROWSER !== '0'
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL || 'chrome'

const DB_NAME = 'cms_ticket_exception_e2e'

export default defineConfig({
  testDir: './tests/e2e-ticket',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  timeout: 180000,
  expect: { timeout: 20000 },
  globalSetup: './tests/e2e-ticket/global-setup.cjs',

  use: {
    baseURL: 'http://127.0.0.1:3011/cms-manage',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1440, height: 900 }
  },

  projects: [
    {
      name: useSystemBrowser ? `system-${browserChannel}` : 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(useSystemBrowser ? { channel: browserChannel as 'chrome' | 'msedge' } : {})
      }
    }
  ],

  webServer: [
    {
      // 后端必须从 dist 启动；env 指向专用库，避免串到业务库或旧 live 库
      name: 'backend',
      command: 'node dist/main',
      cwd: '../../../apps/backend',
      env: {
        DB_DATABASE: DB_NAME,
        AI_MOCK_ENABLED: 'true'
      },
      url: 'http://127.0.0.1:3300/health',
      timeout: 120000,
      reuseExistingServer: false
    },
    {
      name: 'crs',
      command: 'pnpm --filter @cms/crs dev',
      port: 3010,
      timeout: 120000,
      // 不复用：旧进程可能因端口占用落到别的端口，导致串端
      reuseExistingServer: false
    },
    {
      name: 'cms',
      command: 'pnpm --filter @cms/cms dev',
      port: 3011,
      timeout: 120000,
      reuseExistingServer: false
    }
  ]
})
