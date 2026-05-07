import { test } from "@playwright/test";
import { DecoratePage } from "./pages/decorate.page";
import { setupApiMocks } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Page Builder", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
  });

  test("3-panel layout is visible", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectPanelsVisible();
  });

  test("editing existing page shows components on canvas", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectCanvasHasComponents(5);
  });

  test("selecting a component shows right config panel", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickComponent(0);
    await decoratePage.expectRightPanelVisible();
  });

  test("new page shows empty canvas with drop hint", async ({ page }) => {
    // New page has no components
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(); // no id → new page
    await decoratePage.expectCanvasHasComponents(0);
  });
});
