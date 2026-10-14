import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

const workspaceRoot = resolve(__dirname, "../../..");

/**
 * 开发态直接读取 workspace 包源码，改 packages 后无需先 build 即可生效。
 * 生产构建不注入该 alias，仍以各包 dist 产物为准。
 */
/**
 * 开发态直接读取 workspace 包源码，改 packages 后无需先 build 即可生效。
 * 指向源码目录而非单文件 entry：@cms/ui 的 exports 含子路径
 * （./styles/tokens.css、./components/*.vue），必须保留前缀匹配才能解析。
 * 生产构建不注入该 alias，仍以各包 dist 产物为准。
 */
const workspaceSourceAlias = {
  "@cms/types": resolve(workspaceRoot, "packages/types/src"),
  "@cms/utils": resolve(workspaceRoot, "packages/utils/src"),
  "@cms/hooks": resolve(workspaceRoot, "packages/hooks/src"),
  "@cms/ui": resolve(workspaceRoot, "packages/ui/src"),
};

export default defineConfig(({ command }) => ({
  base: "/cms-manage/",
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      ...(command === "serve" ? workspaceSourceAlias : {}),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3011,
    open: true,
    proxy: {
      "/api/atlas-cms": {
        target: "http://127.0.0.1:3300",
        rewrite: (path) => path.replace(/^\/api\/atlas-cms/, "/atlas-cms"),
      },
    },
  },

  optimizeDeps: {
    exclude: ["@cms/utils", "@cms/types", "@cms/ui", "@cms/hooks"],
  },
}));
