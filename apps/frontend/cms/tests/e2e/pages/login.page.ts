import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/cms-manage/login");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 先清掉残留 token 再进登录页：permission.ts 在有 token 时会把 /login
   * 重定向到 /home，导致「登录 → 跳 /activity」的断言等不到目标 URL。
   */
  async login(username: string, password: string) {
    await this.page.context().clearCookies();
    await this.goto();
    await this.page.evaluate(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
    });
    await this.page.reload();
    await this.page.getByPlaceholder(/请输入用户名|username/i).fill(username);
    await this.page.getByPlaceholder(/请输入密码|password/i).fill(password);
    await this.page
      .getByRole("button")
      .filter({ hasText: /登录|login/i })
      .first()
      .click();
  }

  async expectErrorMessage() {
    await expect(this.page.locator(".el-message--error")).toBeVisible({ timeout: 3000 });
  }
}
