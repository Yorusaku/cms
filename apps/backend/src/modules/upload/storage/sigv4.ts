import { createHash, createHmac } from "crypto";

/**
 * AWS Signature Version 4 签名（S3 兼容对象存储）。
 *
 * 只实现本项目上传/健康检查需要的 PUT / HEAD 两个动作，
 * 不引入 aws-sdk（避免为一次签名引入大型依赖）。
 *
 * 说明：算法结构遵循 SigV4 规范（canonical request → string to sign → 派生密钥签名），
 * 单测覆盖结构与可独立复算的中间值（payload hash / 派生密钥 / 签名头格式）；
 * 与具体厂商服务的联调需要在拿到 bucket 参数后进行，见 docs/OPERATIONS.md。
 */

export interface SigV4Input {
  method: string;
  /** 对象路径，例如 `/bucket/key`（path style） */
  path: string;
  /** 查询串（不含 `?`），无则空串 */
  query?: string;
  region: string;
  service?: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** 请求体，用于计算 payload hash */
  body?: Buffer | string;
  /** 参与签名的头，key 必须为小写 */
  headers: Record<string, string>;
  /** 时间戳（默认当前时间），格式化为 amz-date */
  date?: Date;
}

export interface SigV4Result {
  headers: Record<string, string>;
  payloadHash: string;
  amzDate: string;
  signature: string;
}

const sha256Hex = (value: Buffer | string): string =>
  createHash("sha256").update(value).digest("hex");

const hmac = (key: Buffer, value: string): Buffer =>
  createHmac("sha256", key).update(value, "utf8").digest();

/** 20260930T120000Z */
export const formatAmzDate = (date: Date): string =>
  date.toISOString().replace(/[:-]|\.\d{3}/g, "");

/** 20260930 */
export const formatDateStamp = (date: Date): string =>
  formatAmzDate(date).slice(0, 8);

/**
 * 编码 URI 路径：每段单独 encode，保留 `/`（S3 要求）。
 */
export const encodePath = (path: string): string =>
  path
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment)
        .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`),
    )
    .join("/");

export const buildSigningKey = (
  secretAccessKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Buffer => {
  const kDate = hmac(Buffer.from(`AWS4${secretAccessKey}`, "utf8"), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
};

export const signRequest = (input: SigV4Input): SigV4Result => {
  const service = input.service ?? "s3";
  const date = input.date ?? new Date();
  const amzDate = formatAmzDate(date);
  const dateStamp = formatDateStamp(date);
  const payloadHash = sha256Hex(input.body ?? "");

  // 头名统一小写，否则 canonical headers 用小写键取值会取不到
  const normalizedHeaders: Record<string, string> = {};
  Object.entries(input.headers).forEach(([key, value]) => {
    normalizedHeaders[key.toLowerCase()] = value;
  });

  const headers: Record<string, string> = {
    ...normalizedHeaders,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  const sortedHeaderKeys = Object.keys(headers)
    .map((key) => key.toLowerCase())
    .sort();

  const canonicalHeaders = sortedHeaderKeys
    .map((key) => `${key}:${String(headers[key]).trim()}\n`)
    .join("");
  const signedHeaders = sortedHeaderKeys.join(";");

  const canonicalRequest = [
    input.method.toUpperCase(),
    encodePath(input.path),
    input.query ?? "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${input.region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = buildSigningKey(input.secretAccessKey, dateStamp, input.region, service);
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  return {
    headers: { ...headers, authorization },
    payloadHash,
    amzDate,
    signature,
  };
};
