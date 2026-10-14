import { createHash } from "crypto";
import { existsSync, mkdtempSync, rmSync } from "fs";
import { readFile } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { LocalStorageAdapterImpl, resolveUploadDir } from "../src/modules/upload/storage/local-storage.adapter";
import { buildSigningKey, encodePath, formatAmzDate, formatDateStamp, signRequest } from "../src/modules/upload/storage/sigv4";

type EnvMap = Record<string, string | undefined>;

const createConfigService = (env: EnvMap) => ({
  get: jest.fn((key: string, fallback?: string) => (key in env ? env[key] : fallback)),
});

describe("resolveUploadDir", () => {
  it("相对路径基于 cwd 解析为绝对路径，与静态资源目录保持一致", () => {
    const dir = resolveUploadDir(createConfigService({ UPLOAD_DIR: "./uploads" }) as never);
    expect(dir).toBe(resolve(process.cwd(), "./uploads"));
  });

  it("绝对路径原样使用", () => {
    const absolute = resolve(tmpdir(), "cms-uploads-abs");
    expect(resolveUploadDir(createConfigService({ UPLOAD_DIR: absolute }) as never)).toBe(absolute);
  });

  it("未配置时回退到 ./uploads", () => {
    expect(resolveUploadDir(createConfigService({}) as never)).toBe(resolve(process.cwd(), "./uploads"));
  });
});

describe("LocalStorageAdapterImpl", () => {
  let dir: string;
  let adapter: LocalStorageAdapterImpl;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "cms-storage-"));
    adapter = new LocalStorageAdapterImpl(
      createConfigService({
        UPLOAD_DIR: dir,
        UPLOAD_BASE_URL: "http://127.0.0.1:3300/uploads/",
      }) as never,
    );
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("保存文件并返回可访问 URL（baseUrl 末尾斜杠不会重复）", async () => {
    const buffer = Buffer.from("fake-image-bytes");
    const stored = await adapter.save("abc.png", buffer, "image/png");

    expect(stored.key).toBe("abc.png");
    expect(stored.url).toBe("http://127.0.0.1:3300/uploads/abc.png");
    expect(existsSync(join(dir, "abc.png"))).toBe(true);
    expect(await readFile(join(dir, "abc.png"), "utf8")).toBe("fake-image-bytes");
  });

  it("删除文件；文件不存在时静默通过", async () => {
    await adapter.save("to-delete.png", Buffer.from("x"), "image/png");
    await adapter.remove("to-delete.png");
    expect(existsSync(join(dir, "to-delete.png"))).toBe(false);

    await expect(adapter.remove("missing.png")).resolves.toBeUndefined();
  });

  it("健康检查在目录不存在时自动创建并通过", async () => {
    const nested = join(dir, "nested", "uploads");
    const nestedAdapter = new LocalStorageAdapterImpl(
      createConfigService({ UPLOAD_DIR: nested }) as never,
    );

    await expect(nestedAdapter.healthCheck()).resolves.toBeUndefined();
    expect(existsSync(nested)).toBe(true);
  });

  it("驱动标识为 local", () => {
    expect(adapter.driver).toBe("local");
  });
});

describe("sigv4 签名", () => {
  const baseInput = {
    method: "PUT",
    path: "/bucket/key.png",
    region: "cn-shenzhen",
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "SECRETEXAMPLE",
    body: Buffer.from("payload"),
    headers: { host: "oss.example.com", "content-type": "image/png" },
    date: new Date("2026-09-30T12:00:00.000Z"),
  };

  it("时间戳格式符合 amz-date 规范", () => {
    expect(formatAmzDate(new Date("2026-09-30T12:00:00.000Z"))).toBe("20260930T120000Z");
    expect(formatDateStamp(new Date("2026-09-30T12:00:00.000Z"))).toBe("20260930");
  });

  it("payload hash 等于 body 的 sha256（可独立复算）", () => {
    const result = signRequest(baseInput);
    expect(result.payloadHash).toBe(createHash("sha256").update("payload").digest("hex"));
    expect(result.headers["x-amz-content-sha256"]).toBe(result.payloadHash);
  });

  it("Authorization 头包含凭据范围、签名头列表与 64 位签名", () => {
    const result = signRequest(baseInput);
    const authorization = result.headers.authorization;

    expect(authorization).toContain(
      "AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE/20260930/cn-shenzhen/s3/aws4_request",
    );
    // 头名小写参与签名，且 content-type 在 signed headers 内
    expect(authorization).toContain("SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date");
    expect(result.signature).toMatch(/^[0-9a-f]{64}$/);
    expect(authorization).toContain(`Signature=${result.signature}`);
  });

  it("相同输入产生相同签名（确定性），body 变化则签名变化", () => {
    const first = signRequest(baseInput);
    const second = signRequest(baseInput);
    const changed = signRequest({ ...baseInput, body: Buffer.from("other") });

    expect(second.signature).toBe(first.signature);
    expect(changed.signature).not.toBe(first.signature);
  });

  it("路径按段编码并保留斜杠", () => {
    expect(encodePath("/bucket/a b/中文.png")).toBe("/bucket/a%20b/%E4%B8%AD%E6%96%87.png");
  });

  it("派生密钥按 date → region → service → aws4_request 逐级计算", () => {
    const key = buildSigningKey("SECRETEXAMPLE", "20260930", "cn-shenzhen", "s3");
    expect(key).toHaveLength(32);
  });
});
