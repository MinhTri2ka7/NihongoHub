import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from './env.validation.js';

@Injectable()
export class EnvConfigService {
  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  get nodeEnv() {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port() {
    return this.config.get('PORT', { infer: true });
  }

  get database() {
    return {
      url: this.config.get('DATABASE_URL', { infer: true }),
      poolMax: this.config.get('DATABASE_POOL_MAX', { infer: true }),
      connectTimeoutMs: this.config.get('DATABASE_CONNECT_TIMEOUT_MS', {
        infer: true,
      }),
      idleTimeoutMs: this.config.get('DATABASE_IDLE_TIMEOUT_MS', {
        infer: true,
      }),
      queryTimeoutMs: this.config.get('DATABASE_QUERY_TIMEOUT_MS', {
        infer: true,
      }),
    };
  }

  get requestLog() {
    return { directory: this.config.get('REQUEST_LOG_DIR', { infer: true }) };
  }

  get cloudwatch() {
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY', {
      infer: true,
    });
    const sessionToken = this.config.get('AWS_SESSION_TOKEN', { infer: true });
    return {
      enabled: this.config.get('CLOUDWATCH_ENABLED', { infer: true }),
      region: this.config.get('CLOUDWATCH_REGION', { infer: true }),
      logGroup: this.config.get('CLOUDWATCH_LOG_GROUP', { infer: true }),
      logStream: this.config.get('CLOUDWATCH_LOG_STREAM', { infer: true }),
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
              ...(sessionToken ? { sessionToken } : {}),
            }
          : undefined,
    };
  }

  get swagger() {
    return {
      enabled: this.config.get('SWAGGER_ENABLED', { infer: true }),
      path: this.config.get('SWAGGER_PATH', { infer: true }),
      title: this.config.get('SWAGGER_TITLE', { infer: true }),
      version: this.config.get('SWAGGER_VERSION', { infer: true }),
    };
  }

  get observe() {
    return {
      appKey: this.config.get('OBSERVE_APP_KEY', { infer: true }),
      appSecret: this.config.get('OBSERVE_APP_SECRET', { infer: true }),
    };
  }
}
