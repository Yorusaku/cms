import { test } from "@playwright/test";
import { DecoratePage } from "./pages/decorate.page";
import { setupApiMocks } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Linkage Engine E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
  });

  test("linkage config panel is accessible", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    // 验证编辑器加载完成，三面板可见
    await decoratePage.expectPanelsVisible();
  });

  test("selecting component shows configuration options", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    // 点击组件选中
    await decoratePage.clickComponent(0);
    // 验证右侧配置面板可见
    await decoratePage.expectRightPanelVisible();
  });
});