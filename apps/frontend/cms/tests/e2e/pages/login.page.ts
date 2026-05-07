import type { Page } from "@playwright/test";
import { mockToken } from "../fixtures/api-mocks";

export class LoginPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
    await this.page.waitForLoadState("networkidle");
  }

  async fillCredentials(username: string, password: string) {
    await this.page.getByPlaceholder(/用户名|username/i).fill(username);
    await this.page.getByPlaceholder(/密码|password/i).fill(password);
  }

  async submit() {
    await this.page.getByRole("button", { name: /登录|login/i }).click();
  }

  async login(username = "admin", password = "admin123456") {
    await this.goto();
    await this.fillCredentials(username, password);
    await this.submit();
  }

  async expectRedirectTo(path: string) {
    await this.page.waitForURL(`**${path}**`);
  }

  async expectTokenStored() {
    const token = await this.page.evaluate(() => localStorage.getItem("token"));
    return token === mockToken;
  }
}
