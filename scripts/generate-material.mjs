#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const IMPORT_START = "// MATERIALS_AUTO_IMPORTS_START";
const IMPORT_END = "// MATERIALS_AUTO_IMPORTS_END";
const SCHEMA_START = "// MATERIALS_AUTO_SCHEMAS_START";
const SCHEMA_END = "// MATERIALS_AUTO_SCHEMAS_END";
const REGISTRY_START = "// MATERIALS_AUTO_REGISTRY_START";
const REGISTRY_END = "// MATERIALS_AUTO_REGISTRY_END";

const DEEP_ALLOWLIST = "docs/element-deep-override-allowlist.txt";
const SELECTOR_ALLOWLIST = "docs/element-selector-allowlist.txt";
const IMPORTANT_ALLOWLIST = "docs/important-override-allowlist.txt";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`参数 ${token} 缺少值`);
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function pascalToKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function insertBetweenAnchors(content, startAnchor, endAnchor, snippet, dedupeToken) {
  const startIndex = content.indexOf(startAnchor);
  const endIndex = content.indexOf(endAnchor);
  ensure(startIndex !== -1, `未找到锚点: ${startAnchor}`);
  ensure(endIndex !== -1, `未找到锚点: ${endAnchor}`);
  ensure(startIndex < endIndex, `锚点顺序错误: ${startAnchor} -> ${endAnchor}`);

  const head = content.slice(0, startIndex + startAnchor.length);
  const middle = content.slice(startIndex + startAnchor.length, endIndex);
  const tail = content.slice(endIndex);

  if (middle.includes(dedupeToken)) {
    return content;
  }

  const nextMiddle = `${middle.replace(/\s*$/, "\n")}${snippet}\n`;
  return `${head}${nextMiddle}${tail}`;
}

function createVueComponentTemplate(name) {
  return `<template>
  <section class="${pascalToKebab(name)}-block">
    <h3>{{ title }}</h3>
  </section>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
}

withDefaults(defineProps<Props>(), {
  title: "${name} 组件",
});
</script>

<style scoped>
.${pascalToKebab(name)}-block {
  padding: 12px;
  border-radius: 8px;
  background: #ffffff;
}
</style>
`;
}

function createMaterialModuleTemplate(name, group, maxCount, withRuntimeProps) {
  const aliasKebab = pascalToKebab(name);
  const aliasCompact = name.toLowerCase();
  const moduleVar = `${name[0].toLowerCase()}${name.slice(1)}`;
  const runtimePropsBlock = withRuntimeProps
    ? `
  toRuntimeProps: (props) => {
    const normalizedProps = toRecord(props);
    return {
      title: toStringValue(normalizedProps.title, "${name} 组件"),
    };
  },`
    : "";

  return `import type { MaterialDefinition, MaterialEditorSchema } from "@cms/types";
import type { Component } from "vue";
import { toRecord, toStringValue } from "../helpers";

type MaterialRuntimeLoader = () => Promise<Component | { default: Component }>;

const ${moduleVar}EditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "基础配置",
      fields: [
        {
          type: "text",
          path: "title",
          label: "标题",
          placeholder: "请输入标题",
        },
      ],
    },
  ],
};

const ${moduleVar}DefaultProps = {
  title: "${name} 组件",
};

export const ${name}MaterialDefinition: MaterialDefinition<MaterialRuntimeLoader, string> = {
  type: "${name}",
  aliases: ["${aliasCompact}", "${aliasKebab}"],
  group: "${group}",
  label: "${name}",
  icon: "组",
  maxCount: ${maxCount},
  defaultProps: ${moduleVar}DefaultProps,
  runtimeComponent: () => import("../components/${name}Block.vue"),
  editorConfig: {
    mode: "schema",
    schema: ${moduleVar}EditorSchema,
  },
  normalizeProps: (props) => {
    const normalizedProps = toRecord(props);
    return {
      title: toStringValue(normalizedProps.title, "${name} 组件"),
    };
  },${runtimePropsBlock}
};
`;
}

function createTestTemplate(name) {
  const aliasKebab = pascalToKebab(name);
  const aliasCompact = name.toLowerCase();
  return `import { describe, expect, it } from "vitest";
import {
  normalizeMaterialType,
  resolveMaterialDefinition,
  resolveMaterialRuntimeProps,
} from "../../../packages/ui/src/materials";

describe("${name} material smoke", () => {
  it("should resolve type and definition", () => {
    expect(normalizeMaterialType("${aliasCompact}")).toBe("${name}");
    expect(normalizeMaterialType("${aliasKebab}")).toBe("${name}");
    const definition = resolveMaterialDefinition("${name}");
    expect(definition?.type).toBe("${name}");
    expect(definition?.editorConfig.mode).toBe("schema");
  });

  it("should resolve runtime props", () => {
    const runtimeProps = resolveMaterialRuntimeProps("${aliasKebab}", {
      title: "${name} 示例",
    });
    expect(runtimeProps).toMatchObject({
      title: "${name} 示例",
    });
  });
});
`;
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = path.resolve(args.root ?? process.cwd());
  const name = args.name;
  const group = args.group;
  const maxCount = Number(args.maxCount);
  const withRuntimeProps = args.withRuntimeProps;

  ensure(name, "缺少参数: --name");
  ensure(group, "缺少参数: --group");
  ensure(Number.isFinite(maxCount), "缺少参数: --maxCount");
  ensure(withRuntimeProps !== undefined, "缺少参数: --withRuntimeProps");

  ensure(/^[A-Z][A-Za-z0-9]*$/.test(name), "--name 必须是 PascalCase，例如 FooBar");
  ensure(group === "basic" || group === "marketing", "--group 仅支持 basic 或 marketing");
  ensure(Number.isInteger(maxCount) && maxCount > 0, "--maxCount 必须是正整数");
  ensure(
    withRuntimeProps === "true" || withRuntimeProps === "false",
    "--withRuntimeProps 仅支持 true 或 false",
  );

  const definitionsPath = path.join(
    rootDir,
    "packages/ui/src/materials/definitions.ts",
  );
  const generatedDir = path.join(rootDir, "packages/ui/src/materials/generated");
  const componentDir = path.join(rootDir, "packages/ui/src/components");
  const testsDir = path.join(rootDir, "apps/cms/tests");

  ensure(fs.existsSync(definitionsPath), `缺少文件: ${definitionsPath}`);
  ensure(fs.existsSync(componentDir), `缺少目录: ${componentDir}`);
  ensure(fs.existsSync(testsDir), `缺少目录: ${testsDir}`);
  fs.mkdirSync(generatedDir, { recursive: true });

  const componentPath = path.join(componentDir, `${name}Block.vue`);
  const materialModulePath = path.join(generatedDir, `${name}.ts`);
  const testPath = path.join(testsDir, `material-${pascalToKebab(name)}.generated.test.ts`);

  const conflicts = [componentPath, materialModulePath, testPath].filter((p) =>
    fs.existsSync(p),
  );
  ensure(
    conflicts.length === 0,
    `检测到冲突文件:\n${conflicts.map((p) => `- ${p}`).join("\n")}`,
  );

  let definitionsContent = fs.readFileSync(definitionsPath, "utf8");
  ensure(
    !new RegExp(`type:\\s*"${name}"`).test(definitionsContent),
    `definitions.ts 已存在 type: "${name}"`,
  );

  const importSnippet = `import { ${name}MaterialDefinition } from "./generated/${name}";`;
  const schemaSnippet = `// ${name}: schema/defaultProps 在 ./generated/${name}.ts`;
  const registrySnippet = `  ${name}MaterialDefinition,`;

  definitionsContent = insertBetweenAnchors(
    definitionsContent,
    IMPORT_START,
    IMPORT_END,
    importSnippet,
    `${name}MaterialDefinition`,
  );
  definitionsContent = insertBetweenAnchors(
    definitionsContent,
    SCHEMA_START,
    SCHEMA_END,
    schemaSnippet,
    `./generated/${name}.ts`,
  );
  definitionsContent = insertBetweenAnchors(
    definitionsContent,
    REGISTRY_START,
    REGISTRY_END,
    registrySnippet,
    `${name}MaterialDefinition`,
  );

  fs.writeFileSync(componentPath, createVueComponentTemplate(name), "utf8");
  fs.writeFileSync(
    materialModulePath,
    createMaterialModuleTemplate(
      name,
      group,
      maxCount,
      withRuntimeProps === "true",
    ),
    "utf8",
  );
  fs.writeFileSync(testPath, createTestTemplate(name), "utf8");
  fs.writeFileSync(definitionsPath, definitionsContent, "utf8");

  const governanceFiles = [DEEP_ALLOWLIST, SELECTOR_ALLOWLIST, IMPORTANT_ALLOWLIST].map(
    (p) => path.join(rootDir, p),
  );
  const missingGovernanceFiles = governanceFiles.filter((p) => !fs.existsSync(p));

  const checklist = [
    "生成完成，请按清单检查：",
    `- 组件文件: ${path.relative(rootDir, componentPath)}`,
    `- 物料模块: ${path.relative(rootDir, materialModulePath)}`,
    `- 测试样板: ${path.relative(rootDir, testPath)}`,
    `- 已注入注册表: ${path.relative(rootDir, definitionsPath)}`,
    "- 建议执行: pnpm run check:ui-governance",
    `- 建议执行: pnpm --filter @cms/cms test -- material-${pascalToKebab(name)}.generated`,
    "- 建议执行: pnpm lint && pnpm typecheck",
  ];

  if (missingGovernanceFiles.length > 0) {
    checklist.push(
      "- 治理提醒: 以下白名单文件缺失，请先补齐后再提交：",
      ...missingGovernanceFiles.map((p) => `  - ${path.relative(rootDir, p)}`),
    );
  } else {
    checklist.push(
      "- 治理提醒: 若新组件引入 .el-*、:deep(.el-/ .van-) 或 !important，请更新 docs 白名单。",
    );
  }

  // eslint-disable-next-line no-console
  console.log(checklist.join("\n"));
}

try {
  run();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error(`生成失败: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
