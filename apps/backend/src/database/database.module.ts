import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { User } from "../modules/auth/entities/user.entity";
import { Page } from "../modules/page/entities/page.entity";
import { PublishLog } from "../modules/page/entities/publish-log.entity";
import { Template } from "../modules/template/entities/template.entity";
import { SeedService } from "./seed.service";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST", "127.0.0.1"),
        port: config.get<number>("DB_PORT", 5432),
        username: config.get<string>("DB_USERNAME", "postgres"),
        password: config.get<string>("DB_PASSWORD", "postgres"),
        database: config.get<string>("DB_DATABASE", "cms_platform"),
        entities: [User, Page, PublishLog, Template],
        synchronize: config.get<string>("NODE_ENV") === "development",
        logging: config.get<string>("NODE_ENV") === "development",
      }),
    }),
    TypeOrmModule.forFeature([User, Page, PublishLog, Template]),
  ],
  providers: [SeedService],
})
export class DatabaseModule {}
