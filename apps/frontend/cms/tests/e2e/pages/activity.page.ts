import { expect, type Page } from "@playwright/test";

export class ActivityPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/cms-manage/activity");
    await this.page.waitForLoadState("networkidle");
  }

  async searchByName(name: string) {
    const searchInput = this.page.locator(".el-form input").first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill(name);
    await this.page
      .getByRole("button")
      .filter({ hasText: /搜索|查询|search/i })
      .first()
      .click();
  }

  getTableRows() {
    return this.page.locator(".el-table__body-wrapper tbody tr");
  }

  async expectRowCount(count: number) {
    await expect(this.getTableRows()).toHaveCount(count);
  }

  async clickCreatePage() {
    await this.page
      .getByRole("button")
      .filter({ hasText: /新增页面|新增|创建|新建/i })
      .first()
      .click();
  }

  /**
   * 新增页面会先打开「选择模板」弹窗（Action 14 起），
   * 点「跳过，创建空白页」才进入装修页。
   */
  async skipTemplatePicker() {
    const skipButton = this.page
      .locator(".el-dialog__footer .el-button")
      .filter({ hasText: /跳过，创建空白页/ })
      .first();
    await expect(skipButton).toBeVisible({ timeout: 5000 });
    await skipButton.click();
  }

  /** 新增页面并跳过模板，等待进入装修页 */
  async createBlankPageAndWait() {
    await this.clickCreatePage();
    await this.skipTemplatePicker();
    await this.page.waitForURL("**/decorate**", { timeout: 8000 });
  }

  async clickEditPage(rowIndex: number) {
    const rows = this.getTableRows();
    await rows
      .nth(rowIndex)
      .getByRole("button")
      .filter({ hasText: /装修|编辑/i })
      .first()
      .click();
  }

  async clickDeletePage(rowIndex: number) {
    const rows = this.getTableRows();
    await rows
      .nth(rowIndex)
      .getByRole("button")
      .filter({ hasText: /删除|delete/i })
      .first()
      .click();

    const confirmBtn = this.page
      .getByRole("button")
      .filter({ hasText: /确定|确认|ok/i })
      .first();
    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }

  async clickToggleOnline(rowIndex: number) {
    const rows = this.getTableRows();
    const toggle = rows.nth(rowIndex).locator(".el-switch").first();
    await toggle.click();
  }

  async clickPublishLogs(rowIndex: number) {
    const rows = this.getTableRows();
    await rows
      .nth(rowIndex)
      .getByRole("button")
      .filter({ hasText: /发布记录|publish/i })
      .first()
      .click();
  }

  async expectDrawerVisible() {
    await expect(this.page.locator(".el-drawer").first()).toBeVisible({
      timeout: 3000,
    });
  }

  async clickRollbackInDrawer() {
    await this.page
      .locator(".el-drawer")
      .getByRole("button")
      .filter({ hasText: /回滚|还原|恢复|rollback/i })
      .first()
      .click();
  }

  async confirmRollbackIfNeeded() {
    const confirmBtn = this.page
      .locator(".el-message-box")
      .getByRole("button")
      .filter({ hasText: /确认回滚|确定|确认|ok/i })
      .first();

    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
    }
  }
}
