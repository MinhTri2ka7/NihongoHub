import { validateDatabaseEnv } from './database.config.js';
import type { DatabaseEnvironment } from './database.config.js';
import { validateCloudwatchEnv } from './cloudwatch.config.js';
import type { CloudwatchEnvironment } from './cloudwatch.config.js';

export interface EnvironmentVariables
  extends DatabaseEnvironment, CloudwatchEnvironment {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  REQUEST_LOG_DIR: string;
  SWAGGER_ENABLED: boolean;
  SWAGGER_PATH: string;
  SWAGGER_TITLE: string;
  SWAGGER_VERSION: string;
  OBSERVE_APP_KEY: string;
  OBSERVE_APP_SECRET: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const nodeEnv = config.NODE_ENV ?? 'development';
  if (
    nodeEnv !== 'development' &&
    nodeEnv !== 'test' &&
    nodeEnv !== 'production'
  ) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  const requestLogDir = config.REQUEST_LOG_DIR ?? 'logs';
  if (
    typeof requestLogDir !== 'string' ||
    !requestLogDir.trim() ||
    requestLogDir.includes('\0')
  ) {
    throw new Error('REQUEST_LOG_DIR must be a non-empty directory path');
  }

  const swaggerEnabled = config.SWAGGER_ENABLED ?? nodeEnv !== 'production';
  if (
    swaggerEnabled !== true &&
    swaggerEnabled !== false &&
    swaggerEnabled !== 'true' &&
    swaggerEnabled !== 'false'
  ) {
    throw new Error('SWAGGER_ENABLED must be true or false');
  }

  const swaggerPath = config.SWAGGER_PATH ?? 'docs';
  if (
    typeof swaggerPath !== 'string' ||
    !/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(swaggerPath)
  ) {
    throw new Error(
      'SWAGGER_PATH must be a relative URL path such as docs or api/docs',
    );
  }

  const swaggerTitle = config.SWAGGER_TITLE ?? 'Nihongo API';
  const swaggerVersion = config.SWAGGER_VERSION ?? '1.0.0';
  if (typeof swaggerTitle !== 'string' || !swaggerTitle.trim()) {
    throw new Error('SWAGGER_TITLE must be a non-empty string');
  }
  if (typeof swaggerVersion !== 'string' || !swaggerVersion.trim()) {
    throw new Error('SWAGGER_VERSION must be a non-empty string');
  }

  const appKey = config.OBSERVE_APP_KEY ?? '';
  const appSecret = config.OBSERVE_APP_SECRET ?? '';
  if (typeof appKey !== 'string' || typeof appSecret !== 'string') {
    throw new Error('Observe credentials must be strings');
  }
  if (Boolean(appKey) !== Boolean(appSecret)) {
    throw new Error(
      'OBSERVE_APP_KEY and OBSERVE_APP_SECRET must be set together',
    );
  }

  return {
    ...validateDatabaseEnv(config),
    ...validateCloudwatchEnv(config),
    NODE_ENV: nodeEnv,
    PORT: port,
    REQUEST_LOG_DIR: requestLogDir.trim(),
    SWAGGER_ENABLED: swaggerEnabled === true || swaggerEnabled === 'true',
    SWAGGER_PATH: swaggerPath,
    SWAGGER_TITLE: swaggerTitle.trim(),
    SWAGGER_VERSION: swaggerVersion.trim(),
    OBSERVE_APP_KEY: appKey,
    OBSERVE_APP_SECRET: appSecret,
  };
}
