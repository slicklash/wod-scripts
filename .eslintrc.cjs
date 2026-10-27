module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['prettier'],
  rules: {
    "@typescript-eslint/no-explicit-any": ["off"],
    "@typescript-eslint/no-this-alias": ["off"],
    "prettier/prettier": ["error"],
  },
  globals: {
    "GM": true,
    "GM_xmlhttpRequest": true,
    "GM_getValue": true,
    "GM_setValue": true,
    "GM_log": true
  }
}
