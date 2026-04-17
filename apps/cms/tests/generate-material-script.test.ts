import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const scriptPath = path.resolve(
  process.cwd(),
  "../../scripts/generate-material.mjs",
);

const IMPORT_START = "// MATERIALS_AUTO_IMPORTS_START";
const IMPORT_END = "// MATERIALS_AUTO_IMPORTS_END";
const SCHEMA_START = "// MATERIALS_AUTO_SCHEMAS_START";
const SCHEMA_END = "// MATERIALS_AUTO_SCHEMAS_END";
const REGISTRY_START = "// MATERIALS_AUTO_REGISTRY_START";
const REGISTRY_END = "// MATERIALS_AUTO_REGISTRY_END";

function createFixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cms-material-gen-"));
  fs.mkdirSync(path.join(root, "packages/ui/src/components"), { recursive: true });
  fs.mkdirSync(path.join(root, "packages/ui/src/materials/generated"), {
    recursive: true,
  });
  fs.mkdirSync(path.join(root, "apps/cms/tests"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });

  fs.writeFileSync(
    path.join(root, "packages/ui/src/materials/definitions.ts"),
    `import type { MaterialDefinition } from "@cms/types";
type MaterialRegistryItem = MaterialDefinition<unknown, string>;
${IMPORT_START}
${IMPORT_END}
${SCHEMA_START}
${SCHEMA_END}
export const materialRegistry: MaterialRegistryItem[] = [
${REGISTRY_START}
${REGISTRY_END}
];
`,
    "utf8",
  );

  fs.writeFileSync(path.join(root, "docs/element-deep-override-allowlist.txt"), "", "utf8");
  fs.writeFileSync(path.join(root, "docs/element-selector-allowlist.txt"), "", "utf8");
  fs.writeFileSync(path.join(root, "docs/important-override-allowlist.txt"), "", "utf8");
  return root;
}

function runGenerator(root: string, args: string[]) {
  return execFileSync("node", [scriptPath, "--root", root, ...args], {
    encoding: "utf8",
  });
}

describe("generate-material script", () => {
  it("should reject invalid group without writing files", () => {
    const root = createFixtureRoot();

    let error: unknown = null;
    try {
      runGenerator(root, [
        "--name",
        "FooBar",
        "--group",
        "other",
        "--maxCount",
        "10",
        "--withRuntimeProps",
        "true",
      ]);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeTruthy();
    const componentPath = path.join(root, "packages/ui/src/components/FooBarBlock.vue");
    expect(fs.existsSync(componentPath)).toBe(false);
  });

  it("should generate files and inject anchors", () => {
    const root = createFixtureRoot();
    const output = runGenerator(root, [
      "--name",
      "FooBar",
      "--group",
      "basic",
      "--maxCount",
      "10",
      "--withRuntimeProps",
      "true",
    ]);

    expect(output).toContain("生成完成");
    expect(
      fs.existsSync(path.join(root, "packages/ui/src/components/FooBarBlock.vue")),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(root, "packages/ui/src/materials/generated/FooBar.ts")),
    ).toBe(true);
    expect(
      fs.existsSync(
        path.join(root, "apps/cms/tests/material-foo-bar.generated.test.ts"),
      ),
    ).toBe(true);

    const definitions = fs.readFileSync(
      path.join(root, "packages/ui/src/materials/definitions.ts"),
      "utf8",
    );
    expect(definitions).toContain('import { FooBarMaterialDefinition } from "./generated/FooBar";');
    expect(definitions).toContain("FooBarMaterialDefinition");
  });

  it("should reject duplicated files and report conflicts", () => {
    const root = createFixtureRoot();
    runGenerator(root, [
      "--name",
      "FooBar",
      "--group",
      "basic",
      "--maxCount",
      "10",
      "--withRuntimeProps",
      "false",
    ]);

    let error: unknown = null;
    try {
      runGenerator(root, [
        "--name",
        "FooBar",
        "--group",
        "basic",
        "--maxCount",
        "10",
        "--withRuntimeProps",
        "false",
      ]);
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeTruthy();
    expect(String(error)).toContain("检测到冲突文件");
  });
});
