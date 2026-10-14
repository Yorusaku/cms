import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UploadService } from "./upload.service";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("atlas-cms")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post("upload")
  @Roles("admin", "editor")
  @UseInterceptors(FileInterceptor("file"))
  async upload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ data: string }> {
    return this.uploadService.uploadFile(file);
  }

  @Post("uploadImage")
  @Roles("admin", "editor")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ data: string }> {
    return this.uploadService.uploadImage(file);
  }
}
