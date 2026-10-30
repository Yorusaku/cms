import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import pxToViewport from 'postcss-px-to-viewport-8-plugin'

const here = fileURLToPath(new URL('.', import.meta.url))

/**
 * 生产构建补 @cms/ui 的组件样式。
 *
 * 物料组件的 scoped 样式在 packages/ui 库构建时被抽到 dist/ui.css；
 * 生产构建按 exports 从 dist 加载组件，必须带上这份样式，否则公告、表单、
 * 统计卡等共享物料在构建产物里布局会塌。开发态走 src alias，SFC 样式由
 * Vite 直接处理，且 dist 是本地构建产物（未入库），因此只在 build 内联。
 *
 * 放在最前面，让内联进来的 px 也能被后面的 px-to-viewport 统一换算。
 */
const inlineUiDistCss = () => ({
  postcssPlugin: 'inline-cms-ui-dist-css',
  Once(root, { result }) {
    if (process.env.NODE_ENV !== 'production') return
    const file = path.resolve(here, '../../../packages/ui/dist/ui.css')
    if (!fs.existsSync(file)) return
    root.append(fs.readFileSync(file, 'utf8'))
    result.messages.push({
      type: 'dependency',
      plugin: 'inline-cms-ui-dist-css',
      file,
    })
  },
})

export default {
  plugins: [
    inlineUiDistCss(),
    // Tailwind 排在 px-to-viewport 之前：先展开 @import 并生成 packages/ui
    // 共享物料实际用到的 utility，再统一把 px 换算成 vw。
    // 此前缺这一项，CSS 里的 @import "tailwindcss" 只带进了 preflight，
    // 没有任何 .w-4 / .flex-1 工具类，导致 CRS 端共享物料尺寸与间距全部失效。
    tailwindcss(),
    pxToViewport({
      viewportWidth: 375,
      unitPrecision: 3,
      viewportUnit: 'vw',
      selectorBlackList: [],
      minPixelValue: 1,
      mediaQuery: false,
      exclude: [],
    }),
    autoprefixer(),
  ],
}
