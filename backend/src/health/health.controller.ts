import { Controller, Get, Header } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('ready')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Check database readiness' })
  @ApiOkResponse({ description: 'The backend can query its database.' })
  @ApiServiceUnavailableResponse({
    description: 'Database unavailable (DATABASE_UNAVAILABLE).',
  })
  ready() {
    return this.healthService.ready();
  }

  @Get()
  @ApiOperation({ summary: 'Check backend liveness' })
  @ApiOkResponse({
    description: 'The backend is running. Uptime is measured in seconds.',
    schema: {
      type: 'object',
      required: ['status', 'uptime', 'timestamp'],
      properties: {
        status: { type: 'string', enum: ['ok'] },
        uptime: { type: 'number', example: 12.34 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Header('Cache-Control', 'no-store')
  check() {
    return this.healthService.check();
  }
}
