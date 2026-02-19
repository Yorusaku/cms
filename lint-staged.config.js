module.exports = {
  '*.{js,jsx,ts,tsx,vue}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,html,css,scss}': ['prettier --write'],
  'package.json': ['prettier --write']
}
