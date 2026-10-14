import { defineConfig } from "vite";
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
