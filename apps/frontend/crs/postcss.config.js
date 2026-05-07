import pxToViewport from 'postcss-px-to-viewport-8-plugin'

export default {
  plugins: {
    'postcss-px-to-viewport-8-plugin': pxToViewport({
      viewportWidth: 375,
      unitPrecision: 3,
      viewportUnit: 'vw',
      selectorBlackList: [],
      minPixelValue: 1,
      mediaQuery: false,
      exclude: [],
    }),
    autoprefixer: {},
  },
}
