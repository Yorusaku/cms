import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";
import { LocalStorageAdapterImpl } from "./storage/local-storage.adapter";
import { S3StorageAdapter } from "./storage/s3-storage.adapter";
import { STORAGE_ADAPTER, type StorageAdapter, type StorageDriver } from "./storage/storage.adapter";

/**
 * 按 `STORAGE_DRIVER` 选择存储实现：
 * - `local`（默认）：本地磁盘，开发与单机部署
 * - `s3`：S3 兼容对象存储，生产接入公司存储
 *
 * 驱动不支持或参数缺失时直接抛错，让启动失败而不是运行期才发现。
 */
@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    {
      provide: STORAGE_ADAPTER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): StorageAdapter => {
        const driver = (configService.get<string>("STORAGE_DRIVER", "local") || "local")
          .toLowerCase() as StorageDriver;

        if (driver === "s3") {
          return new S3StorageAdapter(configService);
        }
        if (driver === "local") {
          return new LocalStorageAdapterImpl(configService);
        }
        throw new Error(`不支持的 STORAGE_DRIVER=${driver}，可选值为 local | s3`);
      },
    },
  ],
  exports: [UploadService, STORAGE_ADAPTER],
})
export class UploadModule {}
