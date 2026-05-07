import { describe, expect, it } from "vitest";
import type { IPageSchemaV2 } from "@cms/types";
import {
  clearPageDraft,
  loadPageDraft,
  savePageDraft,
} from "../src/utils/page-draft";

const mockSchema: IPageSchemaV2 = {
  version: "2.0.0",
  pageConfig: {
    name: "草稿页",
    shareDesc: "",
    shareImage: "",
    backgroundColor: "",
    backgroundImage: "",
    backgroundPosition: "top",
    cover: "",
  },
  componentMap: {},
  rootIds: [],
  state: undefined,
};

describe("page draft", () => {
  it("can save and load draft by page id", () => {
    clearPageDraft(1001);
    savePageDraft(1001, mockSchema);

    const draft = loadPageDraft(1001);
    expect(draft).toBeTruthy();
    expect(draft?.schema.pageConfig.name).toBe("草稿页");
    expect(typeof draft?.savedAt).toBe("number");
  });

  it("can clear draft", () => {
    savePageDraft(null, mockSchema);
    clearPageDraft(null);
    expect(loadPageDraft(null)).toBeNull();
  });
});
