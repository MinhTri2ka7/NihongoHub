import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { envConfig } from '../../config/env.config.js';
import { ErrorCode } from '../../common/errors/error-code.js';
import { S3_CLIENT } from './s3.tokens.js';

@Injectable()
export class S3StoreService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(S3StoreService.name);
  private readonly settings = envConfig.s3;

  constructor(
    @Inject(S3_CLIENT) private readonly client: S3Client | undefined,
  ) {}

  async onModuleInit(): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.ping();
    this.logger.log('S3 storage connection established');
  }

  async ping(): Promise<void> {
    if (!this.client) {
      throw new ServiceUnavailableException('S3 storage is disabled', {
        errorCode: ErrorCode.STORAGE_UNAVAILABLE,
      });
    }
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.settings.bucket }),
        { abortSignal: AbortSignal.timeout(this.settings.timeoutMs) },
      );
    } catch {
      // SDK errors may contain credentials, endpoints or other private details.
      throw new ServiceUnavailableException('Unable to connect to S3 storage', {
        errorCode: ErrorCode.STORAGE_UNAVAILABLE,
      });
    }
  }

  onApplicationShutdown(): void {
    this.client?.destroy();
  }
}
