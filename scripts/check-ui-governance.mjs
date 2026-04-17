import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const read = (relPath) => fs.readFileSync(path.join(root, relPath), "utf8");
const exists = (relPath) => fs.existsSync(path.join(root, relPath));
const toPosix = (p) => p.replace(/\\/g, "/");

const failures = [];

const ensure = (condition, message) => {
  if (!condition) failures.push(message);
};

const cmsMain = "apps/cms/src/styles/main.css";
const crsMain = "apps/crs/src/styles/main.css";
const renderNode = "apps/crs/src/components/RenderNode.vue";
const tokensCss = "packages/ui/src/styles/tokens.css";
const uiPkg = "packages/ui/package.json";

const deepOverrideAllowlist = "docs/element-deep-override-allowlist.txt";
const elementSelectorAllowlist = "docs/element-selector-allowlist.txt";
const importantAllowlistPath = "docs/important-override-allowlist.txt";

ensure(exists(tokensCss), `${tokensCss} 不存在`);
ensure(exists(cmsMain), `${cmsMain} 不存在`);
ensure(exists(crsMain), `${crsMain} 不存在`);
ensure(exists(renderNode), `${renderNode} 不存在`);
ensure(exists(uiPkg), `${uiPkg} 不存在`);
ensure(exists(deepOverrideAllowlist), `${deepOverrideAllowlist} 不存在`);
ensure(exists(elementSelectorAllowlist), `${elementSelectorAllowlist} 不存在`);
ensure(exists(importantAllowlistPath), `${importantAllowlistPath} 不存在`);

const readAllowlist = (relPath) =>
  new Set(
    read(relPath)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map(toPosix),
  );

const walkFiles = (dirRelPath, exts) => {
  const fullDir = path.join(root, dirRelPath);
  if (!fs.existsSync(fullDir)) return [];

  const out = [];
  const stack = [fullDir];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (entry.isFile() && exts.has(path.extname(entry.name))) {
        out.push(toPosix(path.relative(root, fullPath)));
      }
    }
  }

  return out;
};

if (failures.length === 0) {
  const cmsMainContent = read(cmsMain);
  const crsMainContent = read(crsMain);
  const renderNodeContent = read(renderNode);
  const tokensContent = read(tokensCss);
  const uiPkgJson = JSON.parse(read(uiPkg));

  const tokenImport = '@import "@cms/ui/styles/tokens.css";';

  ensure(
    cmsMainContent.includes(tokenImport),
    `${cmsMain} 必须引入 ${tokenImport}`,
  );
  ensure(
    crsMainContent.includes(tokenImport),
    `${crsMain} 必须引入 ${tokenImport}`,
  );

  ensure(
    !cmsMainContent.includes("--color-primary:"),
    `${cmsMain} 不应重复定义 --color-primary`,
  );
  ensure(
    !crsMainContent.includes("--color-primary:"),
    `${crsMain} 不应重复定义 --color-primary`,
  );

  ensure(
    tokensContent.includes("--color-primary:"),
    `${tokensCss} 缺少 --color-primary 定义`,
  );

  const tokenExport = uiPkgJson?.exports?.["./styles/tokens.css"];
  ensure(
    tokenExport === "./src/styles/tokens.css",
    `${uiPkg} 的 exports 必须包含 "./styles/tokens.css": "./src/styles/tokens.css"`,
  );

  ensure(
    !/import\('\.\/[A-Za-z]+Block\.vue'\)/.test(renderNodeContent),
    `${renderNode} 不应从本地 ./xxxBlock.vue 加载组件`,
  );
  const hasDynamicUiImport = /import\('@cms\/ui'\)/.test(renderNodeContent);
  const hasStaticUiImport =
    /from\s+["']@cms\/ui["']/.test(renderNodeContent) ||
    /import\s+["']@cms\/ui["']/.test(renderNodeContent);
  ensure(
    hasDynamicUiImport || hasStaticUiImport,
    `${renderNode} 应从 @cms/ui 加载组件（静态或异步）`,
  );

  const styleExts = new Set([".vue", ".css", ".less", ".scss"]);

  const allStyleCandidates = walkFiles("apps/cms/src", styleExts).concat(
    walkFiles("apps/crs/src", styleExts),
  );

  const deepAllowlist = readAllowlist(deepOverrideAllowlist);
  const deepPattern = /:deep\(\.(el|van)-/;
  const deepFiles = allStyleCandidates
    .filter((relPath) => deepPattern.test(read(relPath)))
    .map(toPosix)
    .sort();

  const deepNotAllowed = deepFiles.filter((relPath) => !deepAllowlist.has(relPath));
  ensure(
    deepNotAllowed.length === 0,
    `发现未在白名单中的 :deep(.el-/ .van-) 文件:\n${deepNotAllowed
      .map((f) => `- ${f}`)
      .join("\n")}`,
  );

  const deepStale = [...deepAllowlist].filter((relPath) => !deepFiles.includes(relPath));
  if (deepStale.length > 0) {
    console.warn(
      `⚠️ 以下 deep 白名单文件当前已不包含 :deep(.el-/ .van-)，可考虑移除:\n${deepStale
        .map((f) => `- ${f}`)
        .join("\n")}`,
    );
  }

  const selectorAllowlist = readAllowlist(elementSelectorAllowlist);
  const selectorCandidates = walkFiles("apps/cms/src/components", styleExts)
    .concat(walkFiles("apps/cms/src/views", styleExts))
    .concat(walkFiles("apps/crs/src/components", styleExts))
    .concat(walkFiles("apps/crs/src/views", styleExts));

  const selectorPattern = /(^|[^\w-])\.el-[A-Za-z0-9_-]+/m;
  const selectorFiles = selectorCandidates
    .filter((relPath) => selectorPattern.test(read(relPath)))
    .map(toPosix)
    .sort();

  const selectorNotAllowed = selectorFiles.filter(
    (relPath) => !selectorAllowlist.has(relPath),
  );
  ensure(
    selectorNotAllowed.length === 0,
    `发现未在白名单中的 .el-* 选择器文件:\n${selectorNotAllowed
      .map((f) => `- ${f}`)
      .join("\n")}`,
  );

  const selectorStale = [...selectorAllowlist].filter(
    (relPath) => !selectorFiles.includes(relPath),
  );
  if (selectorStale.length > 0) {
    console.warn(
      `⚠️ 以下 .el-* 白名单文件当前已不包含 .el-* 选择器，可考虑移除:\n${selectorStale
        .map((f) => `- ${f}`)
        .join("\n")}`,
    );
  }

  const importantAllowlist = readAllowlist(importantAllowlistPath);
  const importantPattern = /!important/;
  const importantFiles = selectorCandidates
    .filter((relPath) => importantPattern.test(read(relPath)))
    .map(toPosix)
    .sort();

  const importantNotAllowed = importantFiles.filter(
    (relPath) => !importantAllowlist.has(relPath),
  );
  ensure(
    importantNotAllowed.length === 0,
    `发现未在白名单中的 !important 文件:\n${importantNotAllowed
      .map((f) => `- ${f}`)
      .join("\n")}`,
  );

  const importantStale = [...importantAllowlist].filter(
    (relPath) => !importantFiles.includes(relPath),
  );
  if (importantStale.length > 0) {
    console.warn(
      `⚠️ 以下 !important 白名单文件当前已不包含 !important，可考虑移除:\n${importantStale
        .map((f) => `- ${f}`)
        .join("\n")}`,
    );
  }
}

if (failures.length > 0) {
  console.error("❌ UI 栈治理检查未通过:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("✅ UI 栈治理检查通过");
