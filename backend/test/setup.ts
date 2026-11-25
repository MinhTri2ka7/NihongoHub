import { vi } from 'vitest';

// Tests use explicit environment values and never read local credentials.
vi.mock('dotenv', () => ({ config: vi.fn() }));

vi.mock('@nestjs/observe', async () => {
  const { Module } = await import('@nestjs/common');
  class TestObserveModule {
    static forRootAsync() {
      return { module: TestObserveModule };
    }
  }
  Module({})(TestObserveModule);
  return {
    createObserveModule: () => ({
      ObserveModule: TestObserveModule,
      ObserveInstrument: undefined,
    }),
  };
});

const environment = {
  NODE_ENV: 'test',
  PORT: '3000',
  JWT_SECRET: 'test-only-jwt-secret-at-least-32-bytes-long',
  JWT_EXPIRES_IN_SECONDS: '900',
  JWT_ISSUER: 'nihongo-test',
  JWT_AUDIENCE: 'nihongo-test-client',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/nihongo_test',
  DATABASE_POOL_MAX: '1',
  DATABASE_CONNECT_TIMEOUT_MS: '100',
  DATABASE_IDLE_TIMEOUT_MS: '100',
  DATABASE_QUERY_TIMEOUT_MS: '100',
  REQUEST_LOG_DIR: 'test-logs',
  SWAGGER_ENABLED: 'false',
  SWAGGER_PATH: 'docs',
  SWAGGER_TITLE: 'Test API',
  SWAGGER_VERSION: '1.0.0',
  OBSERVE_APP_KEY: '',
  OBSERVE_APP_SECRET: '',
  CLOUDWATCH_ENABLED: 'false',
  S3_ENABLED: 'false',
  SQS_ENABLED: 'false',
  EMAIL_ENABLED: 'false',
  AUTH_EMAIL_VERIFICATION_KEY: '',
  SMTP_HOST: '',
  SMTP_USER: '',
  SMTP_PASS: '',
  EMAIL_FROM: '',
  SQS_REGION: 'ap-southeast-1',
  SQS_QUEUE_URLS: '{}',
  SQS_TIMEOUT_MS: '1000',
  S3_ACCESS_KEY_ID: '',
  S3_SECRET_ACCESS_KEY: '',
  S3_SESSION_TOKEN: '',
  CLOUDWATCH_REGION: '',
  CLOUDWATCH_LOG_GROUP: '',
  CLOUDWATCH_LOG_STREAM: '',
  AWS_ACCESS_KEY_ID: '',
  AWS_SECRET_ACCESS_KEY: '',
  AWS_SESSION_TOKEN: '',
};

for (const [key, value] of Object.entries(environment)) {
  vi.stubEnv(key, value);
}
