import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "..", "..", ".env") });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "cms_platform",
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  synchronize: false,
});
