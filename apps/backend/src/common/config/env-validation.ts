import type { ConfigService } from "@nestjs/config";

/**
 * 生产环境启动校验。
 *
 * 目标：让「用开发默认值跑生产」这件事在启动阶段就失败，
 * 而不是等到线上被登录、数据被默认账号接管之后才发现。
 *
 * 规则：
 * - `NODE_ENV=production` 时下列项为**错误**（拒绝启动）：
 *   JWT_SECRET 缺失/过短/仍是示例值；DB_PASSWORD 为默认值；ADMIN_PASSWORD 为默认值。
 * - 非生产环境只产出**警告**，不阻断本地开发与测试。
 *
 * 判定结果由 main.ts 打印并决定是否退出进程。
 */
export type EnvIssueLevel = "error" | "warn";

export interface EnvIssue {
  level: EnvIssueLevel;
  key: string;
  message: string;
}

/** 示例/占位密钥，出现在生产即视为未配置 */
export const DEFAULT_JWT_SECRETS = [
  "dev-secret",
  "change-this-to-a-random-secret",
  "your-secret",
  "secret",
];

export const DEFAULT_DB_PASSWORDS = ["postgres", "your_password", "root", "password", "123456"];

export const DEFAULT_ADMIN_PASSWORDS = ["admin123456", "admin", "123456"];

/** 本地开发与测试用的兜底密钥；生产环境不允许使用 */
export const DEV_JWT_SECRET = "dev-secret";

const isBlank = (value: string | undefined): boolean => !value || !value.trim();

export const resolveJwtSecret = (configService: ConfigService): string => {
  const secret = configService.get<string>("JWT_SECRET");
  if (!isBlank(secret)) {
    return secret as string;
  }
  if (configService.get<string>("NODE_ENV", "development") === "production") {
    throw new Error("生产环境必须配置 JWT_SECRET，且不能为空");
  }
  return DEV_JWT_SECRET;
};

export const validateEnvironment = (configService: ConfigService): EnvIssue[] => {
  const issues: EnvIssue[] = [];
  const nodeEnv = configService.get<string>("NODE_ENV", "development");
  const isProduction = nodeEnv === "production";
  const level: EnvIssueLevel = isProduction ? "error" : "warn";

  const jwtSecret = configService.get<string>("JWT_SECRET");
  if (isBlank(jwtSecret)) {
    issues.push({
      level,
      key: "JWT_SECRET",
      message: "未配置 JWT_SECRET，登录令牌将使用开发兜底密钥",
    });
  } else if ((jwtSecret as string).length < 32) {
    issues.push({
      level,
      key: "JWT_SECRET",
      message: `JWT_SECRET 长度不足 32 位（当前 ${(jwtSecret as string).length}），容易被暴力破解`,
    });
  } else if (DEFAULT_JWT_SECRETS.includes(jwtSecret as string)) {
    issues.push({
      level,
      key: "JWT_SECRET",
      message: "JWT_SECRET 仍是示例值，请更换为随机密钥",
    });
  }

  const dbPassword = configService.get<string>("DB_PASSWORD");
  if (isBlank(dbPassword) || DEFAULT_DB_PASSWORDS.includes(dbPassword as string)) {
    issues.push({
      level,
      key: "DB_PASSWORD",
      message: "数据库密码为空或为默认值，请使用生产库独立凭据",
    });
  }

  const adminPassword = configService.get<string>("ADMIN_PASSWORD");
  if (isBlank(adminPassword) || DEFAULT_ADMIN_PASSWORDS.includes(adminPassword as string)) {
    issues.push({
      level,
      key: "ADMIN_PASSWORD",
      message: "管理员初始密码为空或为默认值，请配置强密码",
    });
  }

  const storageDriver = (configService.get<string>("STORAGE_DRIVER", "local") || "local").toLowerCase();
  if (storageDriver === "local") {
    // 只提示不阻断：单机部署用本地磁盘是合理选择，需由运维确认
    issues.push({
      level: "warn",
      key: "STORAGE_DRIVER",
      message: "本地磁盘存储在多实例或容器重建后会导致上传文件丢失，生产建议接入对象存储（STORAGE_DRIVER=s3）",
    });
  }

  const seedEnabled = configService.get<string>("SEED_ENABLED");
  if (isProduction && String(seedEnabled ?? "false") !== "false") {
    issues.push({
      level: "warn",
      key: "SEED_ENABLED",
      message: "生产环境启用了种子数据，请确认这是预期行为（生产只会创建管理员账号）",
    });
  }

  return issues;
};
