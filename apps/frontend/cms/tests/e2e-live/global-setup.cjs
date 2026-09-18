const path = require("path");
const { execSync } = require("child_process");

// 该脚本以 CommonJS 运行（根 package.json type=module，故用 .cjs）
// 职责：重建独立测试库 -> 执行 migration -> 写入 seed，保证每次运行都是干净的确定性数据。

const backendDir = path.resolve(__dirname, "../../../../backend");
// pg 仅在 backend 的依赖里，直接通过 backend 的 node_modules 解析
const pg = require(path.join(backendDir, "node_modules", "pg"));

const DB_NAME = process.env.RESUME_DB_DATABASE || "cms_platform_resume_e2e";
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 5433);
const DB_USER = process.env.DB_USERNAME || "postgres";
const DB_PASS = process.env.DB_PASSWORD || "root";

if (!/^[a-z][a-z0-9_]*$/.test(DB_NAME)) {
  throw new Error("RESUME_DB_DATABASE 只能包含小写字母、数字和下划线，且必须以字母开头");
}

async function resetDatabase() {
  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: "postgres",
  });
  await client.connect();
  try {
    await client.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [DB_NAME],
    );
    await client.query(`DROP DATABASE IF EXISTS "${DB_NAME}"`);
    await client.query(`CREATE DATABASE "${DB_NAME}"`);
    console.log(`[e2e-live] 已重建测试库 ${DB_NAME}`);
  } finally {
    await client.end();
  }
}

function run(command) {
  execSync(command, {
    cwd: backendDir,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DB_DATABASE: DB_NAME, RESUME_DB_DATABASE: DB_NAME },
  });
}

module.exports = async function globalSetup() {
  await resetDatabase();
  // 建库脚本幂等，作为兜底确认库存在
  run("node scripts/create-resume-database.cjs");
  run("pnpm migration:run");
  run("pnpm seed");
  console.log("[e2e-live] 测试库准备完成（迁移 + seed）");
};