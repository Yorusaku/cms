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
      file
    })
  }
})

/**
 * 把 px-to-viewport 产出的 `Nvw` 改成 `calc(N * var(--design-vw, 1vw))`。
 *
 * 默认 `--design-vw: 1vw`，与改造前等价（旧营销页行为不变）。
 * business 布局把该变量限制成 `calc(min(100vw, 375px) / 100)`，
 * 于是设计稿 16px 在任何视口下都等于 16px，字号不再随浏览器宽度放大；
 * 布局宽度由容器百分比与 max-width 单独控制，不靠放大字体撑满。
 *
 * 只改写「纯 vw 数值」，并跳过 100vw（页面级整宽不能被压缩到 375）。
 */
const cappedDesignVw = () => ({
  postcssPlugin: 'capped-design-vw',
  // 用 Once 一次性遍历，不要用 Declaration visitor：
  // 在 visitor 里改 decl.value 会让 postcss 重新访问该节点，形成无限循环（构建卡死）。
  Once(root) {
    root.walkDecls(decl => {
      if (!decl.value || !decl.value.includes('vw')) return
      decl.value = decl.value.replace(/(-?\d*\.?\d+)vw\b/g, (matched, number) =>
        number === '100' ? matched : `calc(${number} * var(--design-vw, 1vw))`
      )
    })
  }
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
      // business 布局的规则保留原始 px：它们定义的是「不随视口缩放」的
      // 基准变量、内容宽度与字号，被换成 vw 后又会乘一次 design-vw，直接翻倍。
      selectorBlackList: [/layout-business/],
      minPixelValue: 1,
      mediaQuery: false,
      exclude: []
    }),
    cappedDesignVw(),
    autoprefixer()
  ]
}
