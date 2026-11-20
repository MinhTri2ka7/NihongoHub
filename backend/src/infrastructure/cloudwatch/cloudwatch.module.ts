import { Module } from '@nestjs/common';
import { EnvConfigModule } from '../../config/env-config.module.js';
import { CloudwatchLogService } from './cloudwatch-log.service.js';

@Module({
  imports: [EnvConfigModule],
  providers: [CloudwatchLogService],
  exports: [CloudwatchLogService],
})
export class CloudwatchModule {}
