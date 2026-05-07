import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";

@Controller("atlas-cms")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ data: string }> {
    return this.uploadService.uploadFile(file);
  }

  @Post("uploadImage")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ data: string }> {
    return this.uploadService.uploadImage(file);
  }
}
