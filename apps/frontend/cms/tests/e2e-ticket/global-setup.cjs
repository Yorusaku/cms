const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * 票据异常 E2E 的数据库准备（专属配置）。
 *
 * 与旧 live 套件的 globalSetup 不同：**不 drop、不重建**。
 * 只在库不存在时创建，然后跑增量迁移；账号与模板由后端启动时的
 * SeedService 补齐（不执行全量 seed 命令，不写演示业务数据以外的内容）。
 */
const backendDir = path.resolve(__dirname, "../../../../backend");
const pg = require(path.join(backendDir, "node_modules", "pg"));

const DB_NAME = "cms_ticket_exception_e2e";

// 连接参数从 backend/.env 读取：不改 .env，也不把密码硬编码在脚本里
const readEnv = () => {
  const file = path.join(backendDir, ".env");
  const result = {};
  if (!fs.existsSync(file)) return result;
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const match = /^([A-Z_]+)=(.*)$/.exec(line.trim());
      if (match) result[match[1]] = match[2];
    });
  return result;
};

const fileEnv = readEnv();
const DB_HOST = process.env.DB_HOST || fileEnv.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || fileEnv.DB_PORT || 5433);
const DB_USER = process.env.DB_USERNAME || fileEnv.DB_USERNAME || "postgres";
const DB_PASS = process.env.DB_PASSWORD || fileEnv.DB_PASSWORD || "postgres";

async function ensureDatabase() {
  const client = new pg.Client({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASS,
    database: "postgres",
  });
  await client.connect();
  try {
    const existing = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME],
    );
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`[e2e-ticket] 已创建专用库 ${DB_NAME}`);
    } else {
      console.log(`[e2e-ticket] 沿用已有专用库 ${DB_NAME}`);
    }
  } finally {
    await client.end();
  }
}

module.exports = async function globalSetup() {
  await ensureDatabase();
  execSync("pnpm migration:run", {
    cwd: backendDir,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, DB_DATABASE: DB_NAME },
  });
  console.log("[e2e-ticket] 迁移完成（未重建、未执行全量 seed）");
};
