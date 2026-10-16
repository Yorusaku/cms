import { configDefaults, defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

const workspaceRoot = resolve(__dirname, "../../..");

/** 测试与开发保持同一套解析：直接读取 workspace 包源码，避免 dist 与源码行为分叉 */
const workspaceSourceAlias = {
  "@cms/types": resolve(workspaceRoot, "packages/types/src"),
  "@cms/utils": resolve(workspaceRoot, "packages/utils/src"),
  "@cms/hooks": resolve(workspaceRoot, "packages/hooks/src"),
  "@cms/ui": resolve(workspaceRoot, "packages/ui/src"),
};

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      ...workspaceSourceAlias,
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    // Playwright 的 *.spec.ts（tests/e2e、tests/e2e-live）由 `test:e2e` 运行，
    // 不能被 Vitest 收集，否则 import @playwright/test 直接抛错。
    exclude: [...configDefaults.exclude, "tests/e2e/**", "tests/e2e-live/**"],
    // forks 池在本机执行时会随机抛 EPERM（worker 间通过临时文件传递模块被
    // 系统层拦截），并导致个别测试文件被静默跳过（不报失败）；
    // threads 池连续多轮全量稳定，故显式指定。
    pool: "threads",
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.d.ts",
        "**/{vite,vitest,eslint,prettier}.config.*",
        "**/.{eslint,prettier}rc.{js,cjs,yml}",
      ],
    },
  },
});
