import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "../modules/auth/entities/user.entity";
import { Page } from "../modules/page/entities/page.entity";
import { PublishLog } from "../modules/page/entities/publish-log.entity";
import { Template } from "../modules/template/entities/template.entity";
import { Lead } from "../modules/lead/entities/lead.entity";
import { TrackingEvent } from "../modules/tracking/entities/tracking-event.entity";
import { AuditLog } from "../modules/lead/entities/audit-log.entity";
import { SeedService } from "./seed.service";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<string>("NODE_ENV", "development") === "production";

        /**
         * 生产环境禁止静默回退到开发默认连接：
         * 少配一个 DB_HOST 就默默连到 127.0.0.1 的库，是比启动失败更危险的事。
         */
        const requireInProduction = (key: string, fallback: string): string => {
          const value = config.get<string>(key);
          if (value && String(value).trim()) {
            return value;
          }
          if (isProduction) {
            throw new Error(`生产环境必须显式配置 ${key}`);
          }
          return fallback;
        };

        return {
          type: "postgres",
          host: requireInProduction("DB_HOST", "127.0.0.1"),
          port: Number(requireInProduction("DB_PORT", "5432")),
          username: requireInProduction("DB_USERNAME", "postgres"),
          password: requireInProduction("DB_PASSWORD", "postgres"),
          database: requireInProduction("DB_DATABASE", "cms_platform_resume"),
          entities: [User, Page, PublishLog, Template, Lead, TrackingEvent, AuditLog],
          synchronize: false,
          logging: !isProduction && config.get<string>("NODE_ENV") === "development",
        };
      },
    }),
    TypeOrmModule.forFeature([User, Page, PublishLog, Template, Lead, TrackingEvent, AuditLog]),
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
