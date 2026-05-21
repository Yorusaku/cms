import { test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { DecoratePage } from "./pages/decorate.page";

test.describe("Linkage Engine E2E", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("linkage config panel is accessible", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectPanelsVisible();
  });

  test("selecting component shows configuration options", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickComponent(0);
    await decoratePage.expectRightPanelVisible();
  });
});
