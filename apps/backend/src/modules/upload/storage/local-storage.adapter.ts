import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { mkdirSync } from "fs";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { type StorageAdapter, type StoredFile } from "./storage.adapter";

/**
 * 本地磁盘存储：开发与单机部署使用。
 *
 * 目录解析统一走 `resolveUploadDir`，与 main.ts 的静态资源目录保持同一份逻辑，
 * 避免出现「上传写入 A 目录、静态服务读 B 目录」导致图片 404 的历史问题。
 */
export const resolveUploadDir = (config: ConfigService): string => {
  const configured = config.get<string>("UPLOAD_DIR", "./uploads");
  return resolve(process.cwd(), configured);
};

@Injectable()
export class LocalStorageAdapterImpl implements StorageAdapter {
  readonly driver = "local" as const;
  private readonly logger = new Logger(LocalStorageAdapterImpl.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = resolveUploadDir(configService);
    this.baseUrl = this.configService
      .get<string>("UPLOAD_BASE_URL", "http://127.0.0.1:3300/uploads")
      .replace(/\/+$/, "");

    mkdirSync(this.uploadDir, { recursive: true });
    this.logger.log(`本地存储目录：${this.uploadDir}`);
  }

  async save(key: string, buffer: Buffer): Promise<StoredFile> {
    await mkdir(this.uploadDir, { recursive: true });
    await writeFile(join(this.uploadDir, key), buffer);
    return { key, url: `${this.baseUrl}/${key}` };
  }

  async remove(key: string): Promise<void> {
    try {
      await unlink(join(this.uploadDir, key));
    } catch (error) {
      // 文件已不存在时视为删除成功
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  async healthCheck(): Promise<void> {
    // 能创建目录即可认为可写；不写入探针文件，避免污染上传目录
    await mkdir(this.uploadDir, { recursive: true });
  }
}
