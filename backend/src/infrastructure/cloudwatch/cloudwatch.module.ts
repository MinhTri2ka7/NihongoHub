import { Module } from '@nestjs/common';
import { CloudwatchLogService } from './cloudwatch-log.service.js';

@Module({
  providers: [CloudwatchLogService],
  exports: [CloudwatchLogService],
})
export class CloudwatchModule {}
