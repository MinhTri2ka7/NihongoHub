import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import {
  CloudWatchLogsClient,
  CreateLogStreamCommand,
  PutLogEventsCommand,
  ResourceAlreadyExistsException,
} from '@aws-sdk/client-cloudwatch-logs';
import { EnvConfigService } from '../../config/env-config.service.js';

interface QueuedLogEvent {
  message: string;
  timestamp: number;
  bytes: number;
}

const MAX_BATCH_BYTES = 1_048_576;
const MAX_QUEUED_EVENTS = 1_000;
const MAX_EVENT_BYTES = 256 * 1024;
const MAX_BATCH_SPAN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class CloudwatchLogService
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly logger = new Logger(CloudwatchLogService.name);
  private readonly settings;
  private readonly client: CloudWatchLogsClient | undefined;
  private readonly queue: QueuedLogEvent[] = [];
  private queuedBytes = 0;
  private pending: Promise<void> | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private streamCreated = false;
  private closing = false;
  private overflowReported = false;

  constructor(envConfig: EnvConfigService) {
    this.settings = envConfig.cloudwatch;
    if (this.settings.enabled) {
      this.client = new CloudWatchLogsClient({
        region: this.settings.region,
        credentials: this.settings.credentials,
        maxAttempts: 3,
        requestHandler: { connectionTimeout: 1_000, requestTimeout: 3_000 },
      });
    }
  }

  onModuleInit(): void {
    if (this.client) {
      this.timer = setInterval(() => void this.flush(), 1_000);
      this.timer.unref();
    }
  }

  /** Accept only messages already restricted to safe fields by the caller. */
  writeLog(message: string): void {
    if (!this.client || this.closing) {
      return;
    }
    const bytes = Buffer.byteLength(message, 'utf8') + 26;
    if (
      bytes > MAX_EVENT_BYTES ||
      this.queue.length >= MAX_QUEUED_EVENTS ||
      this.queuedBytes + bytes > MAX_BATCH_BYTES
    ) {
      if (!this.overflowReported) {
        this.logger.warn('CloudWatch log buffer limit reached; events dropped');
        this.overflowReported = true;
      }
      return;
    }
    this.queue.push({ message, timestamp: Date.now(), bytes });
    this.queuedBytes += bytes;
  }

  flush(): Promise<void> {
    if (this.pending) {
      return this.pending;
    }
    if (!this.client || this.queue.length === 0) {
      return Promise.resolve();
    }
    this.pending = this.sendQueuedLogs().finally(() => {
      this.pending = undefined;
    });
    return this.pending;
  }

  async onApplicationShutdown(): Promise<void> {
    this.closing = true;
    if (this.timer) {
      clearInterval(this.timer);
    }
    try {
      await this.flush();
    } finally {
      this.client?.destroy();
    }
  }

  private async sendQueuedLogs(): Promise<void> {
    while (this.queue.length) {
      this.queue.sort((a, b) => a.timestamp - b.timestamp);
      const firstTimestamp = this.queue[0].timestamp;
      let count = 0;
      let bytes = 0;
      for (const event of this.queue) {
        if (
          bytes + event.bytes > MAX_BATCH_BYTES ||
          event.timestamp - firstTimestamp > MAX_BATCH_SPAN_MS
        ) {
          break;
        }
        bytes += event.bytes;
        count++;
      }
      const batch = this.queue.splice(0, count);
      this.queuedBytes -= bytes;
      this.overflowReported = false;
      try {
        await this.ensureLogStream();
        const result = await this.client!.send(
          new PutLogEventsCommand({
            logGroupName: this.settings.logGroup,
            logStreamName: this.settings.logStream,
            logEvents: batch.map(({ message, timestamp }) => ({
              message,
              timestamp,
            })),
          }),
          { abortSignal: AbortSignal.timeout(5_000) },
        );
        if (result.rejectedLogEventsInfo) {
          this.logger.warn('CloudWatch rejected log events');
        }
      } catch {
        // Never feed transport failures back into the same CloudWatch queue.
        this.logger.error('Unable to send CloudWatch logs');
      }
    }
  }

  private async ensureLogStream(): Promise<void> {
    if (this.streamCreated) {
      return;
    }
    try {
      await this.client!.send(
        new CreateLogStreamCommand({
          logGroupName: this.settings.logGroup,
          logStreamName: this.settings.logStream,
        }),
        { abortSignal: AbortSignal.timeout(5_000) },
      );
    } catch (error) {
      if (!(error instanceof ResourceAlreadyExistsException)) {
        throw error;
      }
    }
    this.streamCreated = true;
  }
}
