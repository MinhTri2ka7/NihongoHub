import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { STATUS_CODES } from 'node:http';
import { getErrorCodeForStatus, isErrorCode } from '../errors/error-code.js';
import type { ErrorCode } from '../errors/error-code.js';
import type { RequestWithId } from '../middleware/request-logging.middleware.js';
import { CloudwatchLogService } from '../../infrastructure/cloudwatch/cloudwatch-log.service.js';

@Catch()
export class HttpExceptionFilter extends BaseExceptionFilter<unknown> {
  private readonly errorLogger = new Logger(HttpExceptionFilter.name);

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly cloudwatchLog: CloudwatchLogService,
  ) {
    super();
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    // This filter only formats HTTP responses, not event/RPC/WebSocket errors.
    if (host.getType() !== 'http') {
      throw exception;
    }

    const { httpAdapter } = this.adapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : this.isHttpError(exception)
          ? exception.statusCode
          : HttpStatus.INTERNAL_SERVER_ERROR;
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const entry = {
        method: httpAdapter.getRequestMethod(request),
        status: statusCode,
      };
      this.errorLogger.error(entry);
      this.cloudwatchLog.writeLog(JSON.stringify(entry));
    }

    // A stream may already have started sending its response.
    if (httpAdapter.isHeadersSent(response)) {
      httpAdapter.end(response);
      return;
    }

    const clientError = request.route
      ? this.getClientError(exception, statusCode)
      : { message: STATUS_CODES[statusCode] ?? 'Error', details: [] };

    httpAdapter.reply(
      response,
      {
        code: this.getErrorCode(exception, statusCode),
        message: clientError.message,
        details: clientError.details,
        requestId: request.request_id,
      },
      statusCode,
    );
  }

  private getErrorCode(exception: unknown, statusCode: number): ErrorCode {
    if (exception instanceof HttpException) {
      // Supports Nest's native exception options as well as response bodies.
      if (isErrorCode(exception.errorCode)) {
        return exception.errorCode;
      }
      const body = exception.getResponse();
      if (
        typeof body === 'object' &&
        !(body instanceof Error) &&
        'code' in body &&
        isErrorCode(body.code)
      ) {
        return body.code;
      }
    }

    return getErrorCodeForStatus(statusCode);
  }

  private getClientError(
    exception: unknown,
    statusCode: number,
  ): { message: string; details: string[] } {
    const fallback = STATUS_CODES[statusCode] ?? 'Error';
    const defaultError = { message: fallback, details: [] };
    // Internal error details are excluded from both responses and logs.
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return defaultError;
    }

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        return { message: body, details: [] };
      }
      if (!(body instanceof Error) && 'message' in body) {
        const message: unknown = body.message;
        if (
          Array.isArray(message) &&
          message.every((item) => typeof item === 'string')
        ) {
          return { message: fallback, details: message };
        }
        if (typeof message === 'string') {
          const details: unknown = 'details' in body ? body.details : [];
          return {
            message,
            details:
              Array.isArray(details) &&
              details.every((item) => typeof item === 'string')
                ? details
                : [],
          };
        }
      }
    }

    return defaultError;
  }
}
