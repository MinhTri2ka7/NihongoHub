import { vi } from 'vitest';

// Prevent application imports from opening real environment files.
vi.mock('../src/config/env.loader.js', () => ({
  ENV_FILE_PATHS: [],
  loadEnvironment: () => ({}),
}));

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
