/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@cms/eslint-config/vue-typescript'],
  rules: {
    // 项目自定义规则覆盖
    'vue/multi-word-component-names': 'warn',
    'vue/no-v-html': 'warn'
  }
}
