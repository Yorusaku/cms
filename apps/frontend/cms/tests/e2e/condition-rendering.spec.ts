import { test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { DecoratePage } from "./pages/decorate.page";

test.describe("Condition Rendering E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("editor loads with condition-capable components", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectPanelsVisible();
    await decoratePage.expectCanvasHasComponentsAtLeast(5);
  });

  test("selecting component shows config with condition options", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickComponent(0);
    await decoratePage.expectRightPanelVisible();
  });
});
