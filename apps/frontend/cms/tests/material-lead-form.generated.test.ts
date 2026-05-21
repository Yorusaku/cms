import { describe, expect, it } from "vitest";
import {
  normalizeMaterialType,
  resolveMaterialDefinition,
  resolveMaterialRuntimeProps,
} from "../../../../packages/ui/src/materials";

describe("LeadForm material smoke", () => {
  it("should resolve type and definition", () => {
    expect(normalizeMaterialType("leadform")).toBe("LeadForm");
    expect(normalizeMaterialType("lead-form")).toBe("LeadForm");
    const definition = resolveMaterialDefinition("LeadForm");
    expect(definition?.type).toBe("LeadForm");
    expect(definition?.editorConfig.mode).toBe("schema");
  });

  it("should resolve runtime props", () => {
    const runtimeProps = resolveMaterialRuntimeProps("lead-form", {
      title: "线索表单示例",
      subtitle: "活动报名收集",
      pageId: 123,
      trackingEnabled: false,
    });
    expect(runtimeProps).toMatchObject({
      title: "线索表单示例",
      subtitle: "活动报名收集",
      pageId: 123,
      trackingEnabled: false,
    });
  });
});
