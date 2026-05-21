import { expect, test } from "@playwright/test";
import { setupApiMocks, setupFailedAuthMock } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";
import { LoginPage } from "./pages/login.page";

test.describe("Login", () => {
  test("redirects to /login when unauthenticated", async ({ page }) => {
    await page.goto("/cms-manage/activity");
    await page.waitForURL("**/login**", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });

  test("successful login stores token and redirects to /activity", async ({ page }) => {
    await setupApiMocks(page);
    const loginPage = new LoginPage(page);
    await loginPage.login("admin", "admin123456");

    await page.waitForURL("**/activity**", { timeout: 5000 });
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBe(mockToken);
  });

  test("already authenticated user skips login and redirects to /home", async ({ page }) => {
    await page.goto("/cms-manage/login");
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
    await page.reload();
    await page.waitForURL("**/home**", { timeout: 5000 });
    expect(page.url()).toContain("/home");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await setupFailedAuthMock(page);
    const loginPage = new LoginPage(page);
    await loginPage.login("wrong", "wrong");

    await page.waitForURL("**/login**", { timeout: 5000 });
    expect(page.url()).toContain("/login");
  });
});
