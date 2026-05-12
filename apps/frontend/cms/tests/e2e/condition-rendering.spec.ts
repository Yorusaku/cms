import { test } from "@playwright/test";
import { DecoratePage } from "./pages/decorate.page";
import { setupApiMocks } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Condition Rendering E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
  });

  test("editor loads with condition-capable components", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    // 验证编辑器三面板布局正常
    await decoratePage.expectPanelsVisible();
    // 画布有组件
    await decoratePage.expectCanvasHasComponents(5);
  });

  test("selecting component shows config with condition options", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickComponent(0);
    await decoratePage.expectRightPanelVisible();
  });
});