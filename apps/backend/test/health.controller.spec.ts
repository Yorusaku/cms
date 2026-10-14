import { HealthController } from "../src/common/health/health.controller";

const createResponse = () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
};

const createController = (options: {
  dbQuery?: () => Promise<unknown>;
  storageHealth?: () => Promise<void>;
  driver?: "local" | "s3";
}) => {
  const dataSource = {
    query: jest.fn(options.dbQuery ?? (async () => [{ "?column?": 1 }])),
  };
  const storage = {
    driver: options.driver ?? "local",
    save: jest.fn(),
    remove: jest.fn(),
    healthCheck: jest.fn(options.storageHealth ?? (async () => undefined)),
  };
  return new HealthController(dataSource as never, storage as never);
};

describe("HealthController", () => {
  it("依赖全部可用时返回 200 与 status=ok", async () => {
    const controller = createController({});
    const res = createResponse();

    await controller.check(res as never);

    expect(res.statusCode).toBe(200);
    const body = res.body as {
      status: string;
      storageDriver: string;
      checks: { database: { status: string }; storage: { status: string } };
    };
    expect(body.status).toBe("ok");
    expect(body.storageDriver).toBe("local");
    expect(body.checks.database.status).toBe("up");
    expect(body.checks.storage.status).toBe("up");
    expect(typeof (res.body as { uptimeSeconds: number }).uptimeSeconds).toBe("number");
  });

  it("数据库不可用时返回 503 并标记具体失败项", async () => {
    const controller = createController({
      dbQuery: async () => {
        throw new Error("connect ECONNREFUSED");
      },
    });
    const res = createResponse();

    await controller.check(res as never);

    expect(res.statusCode).toBe(503);
    const body = res.body as {
      status: string;
      checks: { database: { status: string; reason?: string }; storage: { status: string } };
    };
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("down");
    expect(body.checks.database.reason).toContain("ECONNREFUSED");
    // 单个依赖失败不影响另一项的判定
    expect(body.checks.storage.status).toBe("up");
  });

  it("存储不可用时返回 503；对象存储驱动如实上报", async () => {
    const controller = createController({
      driver: "s3",
      storageHealth: async () => {
        throw new Error("对象存储不可用：HTTP 403");
      },
    });
    const res = createResponse();

    await controller.check(res as never);

    expect(res.statusCode).toBe(503);
    const body = res.body as {
      storageDriver: string;
      checks: { storage: { status: string; reason?: string } };
    };
    expect(body.storageDriver).toBe("s3");
    expect(body.checks.storage.status).toBe("down");
    expect(body.checks.storage.reason).toContain("403");
  });

  it("健康检查不返回数据库连接串等敏感信息", async () => {
    const controller = createController({});
    const res = createResponse();

    await controller.check(res as never);

    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("postgres");
    expect(serialized).not.toContain("DB_HOST");
  });
});
