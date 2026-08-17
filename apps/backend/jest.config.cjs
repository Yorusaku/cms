module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  moduleNameMapper: {
    "^@cms/types$": "<rootDir>/test/mocks/cms-types.ts",
    "^@cms/types/(.*)$": "<rootDir>/../../packages/types/src/$1",
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
