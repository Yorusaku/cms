import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/cms-manage/login");
    await this.page.waitForLoadState("networkidle");
  }

  async login(username: string, password: string) {
    await this.goto();
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
