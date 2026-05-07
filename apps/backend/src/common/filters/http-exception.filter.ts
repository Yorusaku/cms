import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse } from "@cms/types";
import { ApiCode } from "@cms/types";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof UnauthorizedException) {
      response.status(HttpStatus.OK).json({
        code: ApiCode.AUTH_FAILED,
        message: "登录失效，请重新登录",
        data: null,
      } satisfies ApiResponse<null>);
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : "服务器内部错误";

    // Map validation errors (400) to VALIDATION_ERROR code
    const code =
      status === HttpStatus.BAD_REQUEST
        ? ApiCode.VALIDATION_ERROR
        : ApiCode.SERVER_ERROR;

    response.status(HttpStatus.OK).json({
      code,
      message,
      data: null,
    } satisfies ApiResponse<null>);
  }
}
