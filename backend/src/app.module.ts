import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthModule } from './health/health.module.js';
import { EnvConfigModule } from './config/env-config.module.js';
import { EnvConfigService } from './config/env-config.service.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { RequestLogService } from './common/logging/request-log.service.js';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { CloudwatchModule } from './infrastructure/cloudwatch/cloudwatch.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    EnvConfigModule,
    DatabaseModule,
    CloudwatchModule,
    HealthModule,
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRootAsync({
      imports: [EnvConfigModule],
      inject: [EnvConfigService],
      useFactory: (envConfig: EnvConfigService) => ({
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
