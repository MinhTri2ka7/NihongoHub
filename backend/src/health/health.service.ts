import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../infrastructure/database/database.service.js';
import { ErrorCode } from '../common/errors/error-code.js';

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseService) {}

  async ready() {
    try {
      await this.database.ping();
    } catch (cause) {
      throw new ServiceUnavailableException('Database is unavailable', {
        errorCode: ErrorCode.DATABASE_UNAVAILABLE,
        cause,
      });
    }
    return {
      status: 'ok',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }

  check() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
