import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { envConfig } from './config/env.config.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { RequestLogService } from './common/logging/request-log.service.js';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { CloudwatchModule } from './infrastructure/cloudwatch/cloudwatch.module.js';
import { S3Module } from './infrastructure/storage/s3.module.js';
import { SqsModule } from './infrastructure/queue/sqs.module.js';
import { EmailModule } from './infrastructure/email/email.module.js';
import { VerificationsModule } from './common/verifications/verifications.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    VerificationsModule,
    DatabaseModule,
    CloudwatchModule,
    S3Module,
    SqsModule,
    EmailModule,
    HealthModule,
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRootAsync({
      useFactory: () => ({
        ...envConfig.observe,
        runtimeMetrics: !process.versions?.['webcontainer'],
        serviceId: 'nest-typescript-starter',
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RequestLogService,
    RequestLoggingMiddleware,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
