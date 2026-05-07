import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

vi.mock("vue-router", () => ({
  useRouter: () => ({
    resolve: (payload: unknown) => ({ href: JSON.stringify(payload) }),
    push: vi.fn(),
  }),
  useRoute: () => ({
    query: {},
  }),
}));

vi.mock("../src/api/activity", () => ({
  getCmsPageList: vi.fn(async () => ({
    code: 10000,
    message: "ok",
    data: { list: [], total: 0, pageNum: 1, pageSize: 10 },
  })),
  getCmsPageById: vi.fn(async () => ({ code: 10000, data: {} })),
  saveCmsPage: vi.fn(async () => ({ code: 10000 })),
  updateStatus: vi.fn(async () => ({ code: 10000 })),
  deletePage: vi.fn(async () => ({ code: 10000 })),
  getPagePublishLogs: vi.fn(async () => ({ code: 10000, data: [] })),
  rollbackPageVersion: vi.fn(async () => ({ code: 10000 })),
}));

import Activity from "../src/views/Activity.vue";

describe("publish log flow integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders publish collaboration controls", async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const wrapper = mount(Activity, {
      global: {
        plugins: [pinia],
        directives: {
          loading: {},
        },
        stubs: {
          "el-card": { template: "<div><slot /></div>" },
          "el-form": { template: "<form><slot /></form>" },
          "el-form-item": { template: "<div><slot /></div>" },
          "el-input": { template: "<input />" },
          "el-select": { template: "<select><slot /></select>" },
          "el-option": { template: "<option />" },
          "el-button": { template: "<button><slot /></button>" },
          "el-table": { template: "<div class='el-table-stub'></div>" },
          "el-table-column": { template: "<div />" },
          "el-tag": { template: "<span><slot /></span>" },
          "el-pagination": { template: "<div />" },
          "el-popconfirm": { template: "<div><slot name='reference' /></div>" },
          "el-drawer": { template: "<div><slot /></div>" },
          "el-empty": { template: "<div />" },
          "el-timeline": { template: "<div><slot /></div>" },
          "el-timeline-item": { template: "<div><slot /></div>" },
          "el-icon": { template: "<i><slot /></i>" },
        },
      },
    });

    const text = wrapper.text();
    expect(text).toContain("发布状态");
    expect(text).toContain("版本记录与回滚");
    expect(text).toContain("活动页面管理");
  });
});
