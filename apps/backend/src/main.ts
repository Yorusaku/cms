import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { json, urlencoded, static as expressStatic } from "express";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "http://localhost:3011",
      "http://127.0.0.1:3011",
      "http://localhost:3012",
      "http://127.0.0.1:3012",
    ],
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

  // Static file serving for uploads
  const uploadDir = join(__dirname, "..", "uploads");
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", expressStatic(uploadDir));

  const port = process.env.PORT || 3300;
  await app.listen(port);
  console.log(`CMS Backend running on http://127.0.0.1:${port}`);
}
bootstrap();
