import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import type { Request, Response, NextFunction } from 'express';
import { RequestLogService } from '../logging/request-log.service.js';
import { getRequestLogPath } from '../logging/request-log-path.js';

export interface RequestWithId extends Request {
  request_id?: string;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly requestLog: RequestLogService) {}

  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incomingId = req.headers['x-request-id'];
    const requestId =
      typeof incomingId === 'string' &&
      /^[a-zA-Z0-9._:-]{1,128}$/.test(incomingId)
        ? incomingId
        : randomUUID();
    req.request_id = requestId;
    res.setHeader('X-Request-Id', requestId);

    const started = performance.now();
    const complete = () => {
      res.off('finish', complete);
      res.off('close', complete);
      this.requestLog.write({
        timestamp: new Date().toISOString(),
        request_id: requestId,
        method: req.method,
        path: getRequestLogPath(req),
        status_code: res.writableFinished ? res.statusCode : 499,
        duration_ms: Number((performance.now() - started).toFixed(2)),
        aborted: !res.writableFinished,
      });
    };
    res.once('finish', complete);
    res.once('close', complete);
    next();
  }
}
