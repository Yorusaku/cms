const { mkdirSync, writeFileSync } = require("fs");
const { resolve } = require("path");

const outputDir = resolve(__dirname, "../dist/cjs");
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, "package.json"), '{"type":"commonjs"}\n');
