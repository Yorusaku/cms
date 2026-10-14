import { Controller, Get, Inject, Res } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import type { Response } from "express";
import { DataSource } from "typeorm";
import { Public } from "../decorators/public.decorator";
import { STORAGE_ADAPTER, type StorageAdapter } from "../../modules/upload/storage/storage.adapter";

interface HealthCheckResult {
  status: "up" | "down";
  durationMs: number;
  reason?: string;
}

interface HealthPayload {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  timestamp: string;
  storageDriver: string;
  checks: {
    database: HealthCheckResult;
    storage: HealthCheckResult;
  };
}

/**
 * 健康检查（公开接口，供探针使用）。
 *
 * 关键点：
 * - 全部依赖正常返回 **200**，任一依赖不可用返回 **503**，
 *   让 k8s / 负载均衡可以直接按状态码判断，不需要解析业务包。
 * - 因此这里用 `@Res()` 直接写响应，绕过统一的 `{ code, message, data }` 包装。
 * - 只暴露依赖状态与耗时，不返回连接串、密钥等敏感信息。
 */
@Controller()
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(STORAGE_ADAPTER)
    private readonly storage: StorageAdapter,
  ) {}

  @Public()
  @Get("health")
  async check(@Res() res: Response): Promise<void> {
    const [database, storage] = await Promise.all([
      this.measure(() => this.dataSource.query("SELECT 1")),
      this.measure(() => this.storage.healthCheck()),
    ]);

    const payload: HealthPayload = {
      status: database.status === "up" && storage.status === "up" ? "ok" : "degraded",
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      storageDriver: this.storage.driver,
      checks: { database, storage },
    };

    res.status(payload.status === "ok" ? 200 : 503).json(payload);
  }

  private async measure(task: () => Promise<unknown>): Promise<HealthCheckResult> {
    const startedAt = Date.now();
    try {
      await task();
      return { status: "up", durationMs: Date.now() - startedAt };
    } catch (error) {
      return {
        status: "down",
        durationMs: Date.now() - startedAt,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
