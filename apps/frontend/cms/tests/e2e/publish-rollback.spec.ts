import { expect, test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { ActivityPage } from "./pages/activity.page";
import { DecoratePage } from "./pages/decorate.page";

test.describe("Publish & Rollback", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("publishing from editor shows success", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickPublish();
    await decoratePage.expectSuccessMessage();
  });

  test("viewing publish logs opens drawer", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickPublishLogs(0);
    await activityPage.expectDrawerVisible();
  });

  test("rolling back from activity page opens decorate tab", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickPublishLogs(0);
    await activityPage.expectDrawerVisible();

    const newTab = page.context().waitForEvent("page");
    await activityPage.clickRollbackInDrawer();
    const decoratePage = await newTab;
    await decoratePage.waitForLoadState("domcontentloaded");
    await expect(decoratePage).toHaveURL(/\/decorate/);
    await decoratePage.close();
  });
});
