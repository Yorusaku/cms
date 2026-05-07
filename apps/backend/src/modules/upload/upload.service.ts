import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v4 as uuid } from "uuid";
import { extname, join } from "path";
import { writeFileSync, existsSync, mkdirSync } from "fs";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir =
      this.configService.get<string>("UPLOAD_DIR", "./uploads");
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<{ data: string }> {
    return this.handleUpload(file);
  }

  async uploadImage(file: Express.Multer.File): Promise<{ data: string }> {
    return this.handleUpload(file);
  }

  private handleUpload(file: Express.Multer.File): { data: string } {
    if (!file) {
      throw new BadRequestException("未提供文件");
    }

    const ext = extname(file.originalname).toLowerCase();
    if (![".jpg", ".jpeg", ".png"].includes(ext)) {
      throw new BadRequestException("仅支持 JPG/PNG 格式");
    }

    const maxSize = this.configService.get<number>("UPLOAD_MAX_SIZE", 10485760);
    if (file.size > maxSize) {
      throw new BadRequestException("文件大小不能超过 2MB");
    }

    const filename = `${uuid()}${ext}`;
    const filepath = join(this.uploadDir, filename);
    writeFileSync(filepath, file.buffer);

    const baseUrl = this.configService.get<string>(
      "UPLOAD_BASE_URL",
      "http://127.0.0.1:3300/uploads",
    );
    const url = `${baseUrl}/${filename}`;

    this.logger.log(`Uploaded: ${filename}`);
    return { data: url };
  }
}
