/**
 * 统一存储接口。
 *
 * 开发环境用本地磁盘（LocalStorageAdapter），生产接入公司对象存储
 * （S3StorageAdapter，S3 兼容协议）——具体厂商与参数通过环境变量注入，
 * 不在代码里写死。见 docs/OPERATIONS.md 的存储配置章节。
 */
export interface StoredFile {
  /** 存储层内部键：本地为文件名，对象存储为对象 key */
  key: string;
  /** 对外可访问 URL */
  url: string;
}

export type StorageDriver = "local" | "s3";

export interface StorageAdapter {
  readonly driver: StorageDriver;

  /** 写入文件并返回可访问地址 */
  save(key: string, buffer: Buffer, contentType: string): Promise<StoredFile>;

  /** 删除文件；对象不存在时不报错 */
  remove(key: string): Promise<void>;

  /** 供 /health 使用：不可用时抛错，错误信息会作为健康检查原因 */
  healthCheck(): Promise<void>;
}

/** DI 注入令牌 */
export const STORAGE_ADAPTER = "STORAGE_ADAPTER";

/** 允许上传的图片类型与扩展名白名单（上传接口与存储层共用） */
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];

/** 扩展名 → Content-Type，用于对象存储写入时声明类型 */
export const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export const resolveContentType = (extension: string): string =>
  IMAGE_CONTENT_TYPES[extension.toLowerCase()] ?? "application/octet-stream";
