import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiResponse } from "@cms/types";
import { ApiCode } from "@cms/types";

/**
 * 全局异常过滤器。
 *
 * 响应约定（沿用项目既有行为）：业务异常统一返回 HTTP 200 + `{ code, message, data }`，
 * 由前端按 code 判定；只有健康检查这类探针接口会使用真实状态码。
 *
 * 日志约定（Action 23 起结构化）：
 * - 5xx 记 `error` 级别，带堆栈，便于排查；
 * - 4xx 记 `warn` 级别，只记摘要，避免噪声；
 * - 输出字段固定（timestamp / method / path / status / code / message），
 *   可直接被采集系统解析。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("HttpException");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof UnauthorizedException
        ? "登录失效，请重新登录"
        : exception instanceof HttpException
          ? exception.message
          : "服务器内部错误";

    const code =
      exception instanceof UnauthorizedException
        ? ApiCode.AUTH_FAILED
        : status === HttpStatus.BAD_REQUEST
          ? ApiCode.VALIDATION_ERROR
          : ApiCode.SERVER_ERROR;

    this.writeLog(request, status, code, message, exception);

    response.status(HttpStatus.OK).json({
      code,
      message,
      data: null,
    } satisfies ApiResponse<null>);
  }

  private writeLog(
    request: Request,
    status: number,
    code: number,
    message: string,
    exception: unknown,
  ): void {
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      method: request?.method ?? "-",
      path: request?.originalUrl ?? request?.url ?? "-",
      status,
      code,
      message,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      payload.stack = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(JSON.stringify(payload));
      return;
    }

    this.logger.warn(JSON.stringify(payload));
  }
}
