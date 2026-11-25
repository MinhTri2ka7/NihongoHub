import { Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { envConfig } from '../../config/env.config.js';
import { S3_CLIENT } from './s3.tokens.js';
import { S3StoreService } from './s3-store.service.js';

@Module({
  providers: [
    {
      provide: S3_CLIENT,
      useFactory: (): S3Client | undefined => {
        const settings = envConfig.s3;
        if (!settings.enabled) {
          return undefined;
        }
        if (
          !settings.bucket.trim() ||
          !settings.region.trim() ||
          !Number.isFinite(settings.timeoutMs) ||
          settings.timeoutMs <= 0
        ) {
          throw new Error('S3 requires a bucket, region and positive timeout');
        }
        return new S3Client({
          region: settings.region,
          endpoint: settings.endpoint,
          forcePathStyle: settings.forcePathStyle,
          credentials: settings.credentials,
          maxAttempts: 3,
          requestHandler: {
            connectionTimeout: settings.timeoutMs,
            requestTimeout: settings.timeoutMs,
          },
        });
      },
    },
    S3StoreService,
  ],
  exports: [S3StoreService, S3_CLIENT],
})
export class S3Module {}
