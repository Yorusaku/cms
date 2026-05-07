import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PageModule } from "./modules/page/page.module";
import { UploadModule } from "./modules/upload/upload.module";
import { JwtAuthGuard } from "./common/guards/auth.guard";
import { resolve } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, "..", ".env"),
    }),
    DatabaseModule,
    AuthModule,
    PageModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
