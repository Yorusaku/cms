import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

const workspaceRoot = resolve(__dirname, "../..");

/**
 * 渲染端单测配置。
 *
 * 与 dev/build 保持同一套解析：直接读 workspace 包源码，
 * 避免 dist 与源码行为分叉（与 CMS 的 vitest 配置对齐）。
 *
 * 说明：这里不接 unplugin-vue-components / Vant resolver——
 * 当前测试对象是渲染链路的纯逻辑（联动引擎、事件桥接），不渲染 Vant 组件。
 * 将来要测用到 Vant 的组件时，再补 resolver。
 */
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
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
});
