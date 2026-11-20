import { ConfigService } from '@nestjs/config';
import { EnvConfigService } from '../../../src/config/env-config.service.js';
import { validateEnv } from '../../../src/config/env.validation.js';
import type { EnvironmentVariables } from '../../../src/config/env.validation.js';

describe('EnvConfigService CloudWatch settings', () => {
  it.each([false, true])(
    'exposes validated credentials (explicit=%s)',
    (explicit) => {
      const settings = validateEnv({
        DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
        CLOUDWATCH_ENABLED: true,
        CLOUDWATCH_REGION: 'ap-southeast-1',
        CLOUDWATCH_LOG_GROUP: '/test',
        CLOUDWATCH_LOG_STREAM: 'test',
        ...(explicit
          ? {
              AWS_ACCESS_KEY_ID: 'test-key',
              AWS_SECRET_ACCESS_KEY: 'test-secret',
              AWS_SESSION_TOKEN: 'test-session',
            }
          : {}),
      });
      const config = new ConfigService<EnvironmentVariables, true>(settings);
      const service = new EnvConfigService(config);
      expect(service.cloudwatch).toEqual({
        enabled: true,
        region: 'ap-southeast-1',
        logGroup: '/test',
        logStream: 'test',
        credentials: explicit
          ? {
              accessKeyId: 'test-key',
              secretAccessKey: 'test-secret',
              sessionToken: 'test-session',
            }
          : undefined,
      });
    },
  );
});
