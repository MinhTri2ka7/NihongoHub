import { Module } from '@nestjs/common';
import { SQSClient } from '@aws-sdk/client-sqs';
import { envConfig } from '../../config/env.config.js';
import { SQS_CLIENT } from './sqs.tokens.js';
import { SqsMessageService } from './sqs-message.service.js';

@Module({
  providers: [
    {
      provide: SQS_CLIENT,
      useFactory: (): SQSClient | undefined => {
        const settings = envConfig.queue;
        if (!settings.enabled) return undefined;
        if (
          !settings.region.trim() ||
          !Number.isSafeInteger(settings.timeoutMs) ||
          settings.timeoutMs <= 0 ||
          settings.timeoutMs > 2147483647 ||
          !Object.keys(settings.queueUrls).length
        ) {
          throw new Error(
            'SQS requires a region, queue aliases and valid timeout',
          );
        }
        return new SQSClient({
          region: settings.region,
          maxAttempts: 3,
          retryMode: 'standard',
          requestHandler: {
            connectionTimeout: settings.timeoutMs,
            requestTimeout: settings.timeoutMs,
          },
        });
      },
    },
    SqsMessageService,
  ],
  exports: [SqsMessageService],
})
export class SqsModule {}
