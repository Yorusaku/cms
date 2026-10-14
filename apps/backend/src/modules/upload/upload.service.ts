import { BadRequestException, Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuid } from "uuid";
import { extname } from "path";
import {
  ALLOWED_IMAGE_EXTENSIONS,
  STORAGE_ADAPTER,
  resolveContentType,
  type StorageAdapter,
} from "./storage/storage.adapter";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    @Inject(STORAGE_ADAPTER)
    private readonly storage: StorageAdapter,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<{ data: string }> {
    return this.handleUpload(file);
  }

  async uploadImage(file: Express.Multer.File): Promise<{ data: string }> {
    return this.handleUpload(file);
  }

  private async handleUpload(file: Express.Multer.File): Promise<{ data: string }> {
    if (!file) {
      throw new BadRequestException("未提供文件");
    }

    const ext = extname(file.originalname).toLowerCase();
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      throw new BadRequestException("仅支持 JPG/PNG 格式");
    }

    const maxSize = Number(this.configService.get<string>("UPLOAD_MAX_SIZE", "10485760"));
    if (file.size > maxSize) {
      throw new BadRequestException(`文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`);
    }

    const key = `${uuid()}${ext}`;
    const stored = await this.storage.save(key, file.buffer, resolveContentType(ext));

    this.logger.log(`上传完成 driver=${this.storage.driver} key=${stored.key}`);
    return { data: stored.url };
  }
}
