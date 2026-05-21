import { test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { DecoratePage } from "./pages/decorate.page";

test.describe("Page Builder", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("3-panel layout is visible", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectPanelsVisible();
  });

  test("editing existing page shows components on canvas", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectCanvasHasComponentsAtLeast(5);
  });

  test("selecting a component shows right config panel", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickComponent(0);
    await decoratePage.expectRightPanelVisible();
  });
});
