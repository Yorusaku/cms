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
    // 先等首屏表格渲染完成（v-loading 遮罩消失）再操作，
    // 否则首屏请求未完时点击「搜索」会被遮罩吞掉，断言一直读到未过滤的初始行。
    await expect(this.getTableRows().first()).toBeVisible({ timeout: 10000 });
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

  /** 按页面名定位行下标（用于审核/发布后表格刷新导致的行序变化），找不到返回 -1 */
  async findRowIndexByName(name: string): Promise<number> {
    const rows = this.getTableRows();
    const count = await rows.count();
    for (let index = 0; index < count; index += 1) {
      const text = await rows.nth(index).innerText();
      if (text.includes(name)) return index;
    }
    return -1;
  }

  /** 行内「提交审核」（draft / rejected 状态可见，admin 与 editor 均可） */
  async clickSubmitReviewInRow(rowIndex: number) {
    await this.getTableRows()
      .nth(rowIndex)
      .getByRole("button", { name: "提交审核", exact: true })
      .first()
      .click();
  }

  /**
   * 等表格刷新完成：Activity 页每次写操作后会重新拉列表，
   * 结果行在刷新期间被 v-loading 遮罩覆盖，先等遮罩消失再操作，避免点击被吞。
   */
  private async waitTableIdle() {
    await expect(this.page.locator(".el-loading-mask"))
      .toBeHidden({ timeout: 10000 })
      .catch(() => undefined);
  }

  /**
   * 等确认弹窗关闭动画结束。
   * 弹窗在关闭过渡期间仍算「可见」，若不等它消失就进入下一步，
   * 下一个动作会匹配到这个正在关闭的旧弹窗，导致找不到可点按钮而超时。
   */
  private async waitMessageBoxClosed() {
    await expect(this.page.locator(".el-message-box:visible"))
      .toHaveCount(0, { timeout: 5000 })
      .catch(() => undefined);
  }

  /** 当前可见的 MessageBox（关闭动画中的残影不计入，避免误命中） */
  private currentMessageBox() {
    return this.page.locator(".el-message-box:visible").last();
  }

  /** 点 MessageBox 的确认按钮并等弹窗关闭、表格刷新 */
  private async confirmMessageBox() {
    const box = this.currentMessageBox();
    await expect(box).toBeVisible({ timeout: 5000 });
    // 确认按钮统一取弹窗内的 primary 按钮：不同调用点文案不一致
    // （审核 prompt 传了中文「确定」，发布 confirm 未传文案时 Element Plus 渲染默认英文 "OK"），
    // 按样式类定位比按文案更稳。
    const confirmButton = box
      .locator(".el-message-box__btns button.el-button--primary")
      .first();
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();
    await this.waitMessageBoxClosed();
    await this.waitTableIdle();
  }

  /** 行内「通过审核」：ElMessageBox.prompt 需要填审核备注后确认（admin 专属） */
  async approveRow(rowIndex: number, note = "自动化审核通过") {
    await this.waitTableIdle();
    await this.getTableRows()
      .nth(rowIndex)
      .getByRole("button", { name: "通过审核", exact: true })
      .first()
      .click();

    const box = this.currentMessageBox();
    await expect(box).toBeVisible({ timeout: 5000 });
    const noteInput = box.locator("textarea").first();
    if ((await noteInput.count()) > 0) {
      await noteInput.fill(note);
    }
    await this.confirmMessageBox();
  }

  /** 行内「发布」：ElMessageBox.confirm 需要确认（admin 专属，精确匹配避免命中「回滚到最新发布」） */
  async publishRow(rowIndex: number) {
    await this.waitTableIdle();
    await this.getTableRows()
      .nth(rowIndex)
      .getByRole("button", { name: "发布", exact: true })
      .first()
      .click();

    await this.confirmMessageBox();
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
