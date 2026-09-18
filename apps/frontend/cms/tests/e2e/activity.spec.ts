import { expect, test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { ActivityPage } from "./pages/activity.page";

test.describe("Activity List", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("renders page list with rows", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.expectRowCount(10);
  });

  test("search filters the list by name", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.searchByName("618");
    await activityPage.expectRowCount(1);
  });

  test("create page navigates to decorate view", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    // 新增页面先弹出「选择模板」，跳过模板后进入装修页
    await activityPage.createBlankPageAndWait();
    await expect(page).toHaveURL(/\/decorate/);
  });
});
