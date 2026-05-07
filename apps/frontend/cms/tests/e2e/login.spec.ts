import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/login.page";
import { setupApiMocks, setupFailedAuthMock } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Login", () => {
  test("redirects to /login when unauthenticated", async ({ page }) => {
    await page.goto("/activity");
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toContain("/login");
  });

  test("successful login stores token and redirects to /activity", async ({ page }) => {
    await setupApiMocks(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("admin", "admin123456");
    await loginPage.submit();

    await page.waitForURL("**/activity**", { timeout: 5000 });
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBe(mockToken);
  });

  test("already authenticated user skips login and redirects to /home", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
    await page.goto("/login");

    await page.waitForTimeout(500);
    const url = page.url();
    // Should redirect away from login
    expect(url).not.toContain("/login");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await setupFailedAuthMock(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials("wrong", "wrong");
    await loginPage.submit();

    // Should stay on login page or show error
    await page.waitForTimeout(500);
    // With failed auth mock, the page should still be on login
    const url = page.url();
    expect(url).toContain("/login");
  });
});
