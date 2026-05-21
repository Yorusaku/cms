import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PageModule } from "./modules/page/page.module";
import { UploadModule } from "./modules/upload/upload.module";
import { UserModule } from "./modules/user/user.module";
import { TemplateModule } from "./modules/template/template.module";
import { LeadModule } from "./modules/lead/lead.module";
import { TrackingModule } from "./modules/tracking/tracking.module";
import { JwtAuthGuard } from "./common/guards/auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { resolve } from "path";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), ".env"),
    }),
    DatabaseModule,
    AuthModule,
    UserModule,
    PageModule,
    TemplateModule,
    LeadModule,
    TrackingModule,
    UploadModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
