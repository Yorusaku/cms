import { test } from "@playwright/test";
import { ActivityPage } from "./pages/activity.page";
import { setupApiMocks } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Activity List", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
  });

  test("renders page list with rows", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.expectRowCount(12);
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
    await activityPage.clickCreatePage();
    await page.waitForURL("**/decorate**", { timeout: 5000 });
  });

  test("delete page removes a row", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickDeletePage(0);
    await activityPage.expectRowCount(11);
  });

  test("toggle online status works", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickToggleOnline(0);
  });
});
