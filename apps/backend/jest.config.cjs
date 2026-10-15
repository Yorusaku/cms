module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "^@cms/types$": "<rootDir>/test/mocks/cms-types.ts",
    // 子路径指向 CJS 产物：packages/types 是 ESM 包（type: module），
    // Jest（CommonJS）直接加载其 src 会因模块格式不匹配失败
    "^@cms/types/(.*)$": "<rootDir>/../../packages/types/dist/cjs/$1",
  },
  rootDir: ".",
  testEnvironment: "node",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
};
