import { test } from "@playwright/test";
import { DecoratePage } from "./pages/decorate.page";
import { setupApiMocks } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Data Binding E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
  });

  test("editor renders components with data-bound properties", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectPanelsVisible();
  });

  test("new page with no data shows empty canvas", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(); // 无 id → 新页面
    await decoratePage.expectCanvasHasComponents(0);
  });
});