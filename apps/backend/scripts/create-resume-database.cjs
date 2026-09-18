const path = require("path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const database = process.env.RESUME_DB_DATABASE || "cms_platform_resume";

if (!/^[a-z][a-z0-9_]*$/.test(database)) {
  throw new Error("RESUME_DB_DATABASE 只能包含小写字母、数字和下划线，且必须以字母开头");
}

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: "postgres",
  });

  await client.connect();
  try {
    const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
    if (existing.rowCount === 0) {
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`Created database: ${database}`);
    } else {
      console.log(`Database already exists: ${database}`);
    }
  } finally {
    await client.end();
  }
}

createDatabase().catch((error) => {
  console.error(`Unable to create resume database: ${error.message}`);
  process.exit(1);
});
