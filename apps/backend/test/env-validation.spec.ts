import { validateEnvironment, resolveJwtSecret, DEV_JWT_SECRET } from "../src/common/config/env-validation";

type EnvMap = Record<string, string | undefined>;

const createConfigService = (env: EnvMap) => ({
  get: jest.fn((key: string, fallback?: string) => (key in env ? env[key] : fallback)),
});

const baseProductionEnv: EnvMap = {
  NODE_ENV: "production",
  JWT_SECRET: "a".repeat(48),
  DB_HOST: "db.internal",
  DB_PORT: "5432",
  DB_USERNAME: "cms",
  DB_PASSWORD: "S3cure-Pr0d-Passw0rd",
  DB_DATABASE: "cms_prod",
  ADMIN_PASSWORD: "Adm1n-Pr0d-Passw0rd",
  STORAGE_DRIVER: "s3",
};

const errorKeys = (env: EnvMap) =>
  validateEnvironment(createConfigService(env) as never)
    .filter((issue) => issue.level === "error")
    .map((issue) => issue.key);

describe("validateEnvironment", () => {
  it("生产环境配置齐全时无 error", () => {
    expect(errorKeys(baseProductionEnv)).toEqual([]);
  });

  it("生产环境使用示例 JWT_SECRET 时拒绝启动", () => {
    expect(errorKeys({ ...baseProductionEnv, JWT_SECRET: "dev-secret" })).toContain("JWT_SECRET");
    expect(
      errorKeys({ ...baseProductionEnv, JWT_SECRET: "change-this-to-a-random-secret" }),
    ).toContain("JWT_SECRET");
  });

  it("生产环境 JWT_SECRET 过短或缺失时拒绝启动", () => {
    expect(errorKeys({ ...baseProductionEnv, JWT_SECRET: "short-secret" })).toContain("JWT_SECRET");
    expect(errorKeys({ ...baseProductionEnv, JWT_SECRET: undefined })).toContain("JWT_SECRET");
  });

  it("生产环境数据库密码为默认值时拒绝启动", () => {
    ["postgres", "your_password", "root", ""].forEach((password) => {
      expect(errorKeys({ ...baseProductionEnv, DB_PASSWORD: password })).toContain("DB_PASSWORD");
    });
  });

  it("生产环境管理员密码为默认值时拒绝启动", () => {
    expect(errorKeys({ ...baseProductionEnv, ADMIN_PASSWORD: "admin123456" })).toContain(
      "ADMIN_PASSWORD",
    );
  });

  it("生产环境使用本地存储只警告不阻断", () => {
    const issues = validateEnvironment(
      createConfigService({ ...baseProductionEnv, STORAGE_DRIVER: "local" }) as never,
    );
    const storageIssue = issues.find((issue) => issue.key === "STORAGE_DRIVER");
    expect(storageIssue?.level).toBe("warn");
    expect(issues.some((issue) => issue.level === "error")).toBe(false);
  });

  it("开发环境相同配置只产出警告，不阻断本地开发", () => {
    const issues = validateEnvironment(
      createConfigService({
        NODE_ENV: "development",
        JWT_SECRET: "dev-secret",
        DB_PASSWORD: "postgres",
        ADMIN_PASSWORD: "admin123456",
        STORAGE_DRIVER: "local",
      }) as never,
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.every((issue) => issue.level === "warn")).toBe(true);
  });
});

describe("resolveJwtSecret", () => {
  it("有配置时直接返回", () => {
    const config = createConfigService({ JWT_SECRET: "configured-secret" });
    expect(resolveJwtSecret(config as never)).toBe("configured-secret");
  });

  it("开发环境缺失时回退到开发密钥", () => {
    const config = createConfigService({ NODE_ENV: "development" });
    expect(resolveJwtSecret(config as never)).toBe(DEV_JWT_SECRET);
  });

  it("生产环境缺失时抛错，不回退默认密钥", () => {
    const config = createConfigService({ NODE_ENV: "production" });
    expect(() => resolveJwtSecret(config as never)).toThrow("生产环境必须配置 JWT_SECRET");
  });
});
