import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { appendFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { envConfig } from '../../config/env.config.js';
import { CloudwatchLogService } from '../../infrastructure/cloudwatch/cloudwatch-log.service.js';

import type { RequestLogEntry } from './interfaces/log.interface.js';

@Injectable()
export class RequestLogService implements OnApplicationShutdown {
  private readonly logger = new Logger(RequestLogService.name);
  private pending: Promise<void> = Promise.resolve();

  constructor(private readonly cloudwatchLog: CloudwatchLogService) {}

  write(entry: RequestLogEntry): void {
    const line = JSON.stringify(entry);
    this.logger.log(line);
    this.cloudwatchLog.writeLog(line);
    const directory = envConfig.requestLog.directory;
    const file = join(
      directory,
      `requests-${entry.timestamp.slice(0, 10)}.jsonl`,
    );
    this.pending = this.pending
      .then(async () => {
        await mkdir(directory, { recursive: true });
        await appendFile(file, `${line}\n`, 'utf8');
      })
      .catch(() => {
        this.logger.error('Unable to write request log');
      });
  }

  async flush(): Promise<void> {
    await this.pending;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.flush();
  }
}
