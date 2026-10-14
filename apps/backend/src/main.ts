import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { validateEnvironment } from "./common/config/env-validation";
import { resolveUploadDir } from "./modules/upload/storage/local-storage.adapter";
import { json, urlencoded, static as expressStatic } from "express";
import { existsSync, mkdirSync } from "fs";

const DEFAULT_CORS_ORIGINS = [
  "http://localhost:3011",
  "http://127.0.0.1:3011",
  "http://localhost:3010",
  "http://127.0.0.1:3010",
];

const resolveCorsOrigins = (configService: ConfigService): string[] => {
  const configured = configService.get<string>("CORS_ORIGINS");
  if (!configured || !configured.trim()) {
    return DEFAULT_CORS_ORIGINS;
  }
  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 生产环境配置校验：用开发默认值跑生产时直接拒绝启动
  const issues = validateEnvironment(configService);
  issues.forEach((issue) => {
    const line = `[env:${issue.key}] ${issue.message}`;
    if (issue.level === "error") {
      logger.error(line);
    } else {
      logger.warn(line);
    }
  });
  if (issues.some((issue) => issue.level === "error")) {
    logger.error("环境校验未通过，进程退出；请先修正上方配置后重启");
    process.exit(1);
  }

  app.enableCors({
    origin: resolveCorsOrigins(configService),
    credentials: true,
  });

  // Large JSON bodies for page schema
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(new AllExceptionsFilter());

  // 本地存储才需要静态文件服务；对象存储由 bucket / CDN 直接提供访问
  const storageDriver = (
    configService.get<string>("STORAGE_DRIVER", "local") || "local"
  ).toLowerCase();
  if (storageDriver === "local") {
    const uploadDir = resolveUploadDir(configService);
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }
    app.use("/uploads", expressStatic(uploadDir));
    logger.log(`上传目录：${uploadDir}`);
  } else {
    logger.log(`存储驱动：${storageDriver}（不挂载本地静态目录）`);
  }

  const port = Number(configService.get<string>("PORT", "3300"));
  await app.listen(port);
  logger.log(`CMS Backend running on http://127.0.0.1:${port}`);
}
bootstrap();
