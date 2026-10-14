import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type StorageAdapter, type StoredFile } from "./storage.adapter";
import { signRequest } from "./sigv4";

/**
 * S3 兼容对象存储 adapter（生产用）。
 *
 * 参数全部来自环境变量，不写死厂商：
 * - `S3_ENDPOINT`        服务地址，如 https://oss-cn-shenzhen.aliyuncs.com
 * - `S3_REGION`          区域，默认 us-east-1
 * - `S3_BUCKET`          bucket / 空间名
 * - `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`  凭据
 * - `S3_PUBLIC_BASE_URL` 对外访问前缀（CDN 地址）；缺省时用 `endpoint/bucket`
 * - `S3_FORCE_PATH_STYLE` 是否使用 path style，默认 true（MinIO / 多数兼容实现需要）
 *
 * 注意：签名实现（SigV4）在单测中覆盖结构与可复算的中间值，
 * 与公司实际对象存储的联调需在拿到 bucket 参数后进行，见 docs/OPERATIONS.md。
 */
@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  readonly driver = "s3" as const;
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly endpoint: string;
  private readonly region: string;
  private readonly bucket: string;
  private readonly accessKeyId: string;
  private readonly secretAccessKey: string;
  private readonly publicBaseUrl: string;

  constructor(configService: ConfigService) {
    this.endpoint = this.require(configService, "S3_ENDPOINT").replace(/\/+$/, "");
    this.region = configService.get<string>("S3_REGION", "us-east-1");
    this.bucket = this.require(configService, "S3_BUCKET");
    this.accessKeyId = this.require(configService, "S3_ACCESS_KEY_ID");
    this.secretAccessKey = this.require(configService, "S3_SECRET_ACCESS_KEY");
    this.publicBaseUrl = (
      configService.get<string>("S3_PUBLIC_BASE_URL") ?? `${this.endpoint}/${this.bucket}`
    ).replace(/\/+$/, "");
  }

  async save(key: string, buffer: Buffer, contentType: string): Promise<StoredFile> {
    const path = this.objectPath(key);
    const url = `${this.endpoint}${path}`;
    const signed = signRequest({
      method: "PUT",
      path,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      body: buffer,
      headers: {
        host: new URL(this.endpoint).host,
        "content-type": contentType,
      },
    });

    const response = await fetch(url, {
      method: "PUT",
      headers: { ...signed.headers, "content-length": String(buffer.byteLength) },
      body: new Uint8Array(buffer),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      this.logger.error(`对象存储写入失败 status=${response.status} key=${key}`);
      throw new Error(`对象存储写入失败：${response.status}${detail ? ` ${detail.slice(0, 200)}` : ""}`);
    }

    return { key, url: `${this.publicBaseUrl}/${key}` };
  }

  async remove(key: string): Promise<void> {
    const path = this.objectPath(key);
    const signed = signRequest({
      method: "DELETE",
      path,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      headers: { host: new URL(this.endpoint).host },
    });

    const response = await fetch(`${this.endpoint}${path}`, {
      method: "DELETE",
      headers: signed.headers,
    });

    // 对象本就不存在时按删除成功处理
    if (!response.ok && response.status !== 404) {
      this.logger.error(`对象存储删除失败 status=${response.status} key=${key}`);
      throw new Error(`对象存储删除失败：${response.status}`);
    }
  }

  async healthCheck(): Promise<void> {
    const path = this.objectPath("");
    const signed = signRequest({
      method: "HEAD",
      path,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      headers: { host: new URL(this.endpoint).host },
    });

    const response = await fetch(`${this.endpoint}${path}`, {
      method: "HEAD",
      headers: signed.headers,
    });

    // 403 说明凭据无效；404 说明桶不存在；其余 2xx/3xx 视为可用
    if (response.status === 403 || response.status === 404) {
      throw new Error(`对象存储不可用：HTTP ${response.status}`);
    }
    if (response.status >= 500) {
      throw new Error(`对象存储不可用：HTTP ${response.status}`);
    }
  }

  private objectPath(key: string): string {
    const normalized = key.replace(/^\/+/, "");
    return normalized ? `/${this.bucket}/${normalized}` : `/${this.bucket}`;
  }

  private require(configService: ConfigService, key: string): string {
    const value = configService.get<string>(key);
    if (!value) {
      throw new Error(`STORAGE_DRIVER=s3 时缺少必填环境变量 ${key}`);
    }
    return value;
  }
}
