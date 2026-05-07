import { type Page, expect } from "@playwright/test";

export class ActivityPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto("/activity");
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
  }

  async searchByName(name: string) {
    const searchInput = this.page.getByPlaceholder(/名称|搜索|search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill(name);
      await this.page.getByRole("button", { name: /搜索|查询/i }).click();
      await this.page.waitForTimeout(500);
    }
  }

  getTableRows() {
    return this.page.locator(".el-table__body-wrapper tbody tr");
  }

  async expectRowCount(count: number) {
    await expect(this.getTableRows()).toHaveCount(count);
  }

  async clickCreatePage() {
    await this.page.getByRole("button", { name: /新增|创建|新建/i }).click();
  }

  async clickEditPage(rowIndex: number) {
    const rows = this.getTableRows();
    await rows.nth(rowIndex).getByRole("button", { name: /装修|编辑/i }).click();
  }

  async clickDeletePage(rowIndex: number) {
    const rows = this.getTableRows();
    await rows.nth(rowIndex).getByRole("button", { name: /删除/i }).click();
    // Confirm dialog
    const confirmBtn = this.page.getByRole("button", { name: /确定|确认/i });
    if (await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await this.page.waitForTimeout(300);
  }

  async clickToggleOnline(rowIndex: number) {
    const rows = this.getTableRows();
    const toggle = rows.nth(rowIndex).locator(".el-switch");
    await toggle.click();
    await this.page.waitForTimeout(300);
  }

  async clickPublishLogs(rowIndex: number) {
    const rows = this.getTableRows();
    await rows.nth(rowIndex).getByRole("button", { name: /发布记录/i }).click();
    await this.page.waitForTimeout(300);
  }

  async expectDrawerVisible() {
    await expect(this.page.locator(".el-drawer").first()).toBeVisible({ timeout: 3000 });
  }

  async clickRollbackInDrawer() {
    await this.page.locator(".el-drawer").getByRole("button", { name: /回滚|还原|恢复/i }).first().click();
  }
}
