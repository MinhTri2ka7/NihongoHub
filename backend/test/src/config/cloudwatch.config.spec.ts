import { validateCloudwatchEnv } from '../../../src/config/cloudwatch.config.js';

const enabledConfig = {
  CLOUDWATCH_ENABLED: 'true',
  CLOUDWATCH_REGION: 'ap-southeast-1',
  CLOUDWATCH_LOG_GROUP: '/nihongo/backend/test',
  CLOUDWATCH_LOG_STREAM: 'local-test',
};

describe('validateCloudwatchEnv', () => {
  it('defaults to disabled without requiring AWS credentials', () => {
    const config = validateCloudwatchEnv({});
    expect(config.CLOUDWATCH_ENABLED).toBe(false);
    expect(config.AWS_ACCESS_KEY_ID).toBe('');
  });

  it('allows the SDK default credential chain when no keys are supplied', () => {
    expect(validateCloudwatchEnv(enabledConfig).CLOUDWATCH_ENABLED).toBe(true);
  });

  it('accepts explicit temporary credentials', () => {
    const config = validateCloudwatchEnv({
      ...enabledConfig,
      AWS_ACCESS_KEY_ID: 'test-key',
      AWS_SECRET_ACCESS_KEY: 'test-secret',
      AWS_SESSION_TOKEN: 'test-session',
    });
    expect(config.AWS_SESSION_TOKEN).toBe('test-session');
  });

  it.each([
    { CLOUDWATCH_ENABLED: 'yes' },
    { CLOUDWATCH_ENABLED: 1 },
    { CLOUDWATCH_REGION: '' },
    { CLOUDWATCH_REGION: 'private-url' },
    { CLOUDWATCH_LOG_GROUP: '' },
    { CLOUDWATCH_LOG_GROUP: 'bad group' },
    { CLOUDWATCH_LOG_GROUP: 'a'.repeat(513) },
    { CLOUDWATCH_LOG_STREAM: '' },
    { CLOUDWATCH_LOG_STREAM: 'bad:stream' },
    { CLOUDWATCH_LOG_STREAM: 'bad\nstream' },
    { AWS_ACCESS_KEY_ID: 'private-key' },
    { AWS_SECRET_ACCESS_KEY: 'private-secret' },
    { AWS_SESSION_TOKEN: 'private-token' },
    { AWS_SECRET_ACCESS_KEY: { secret: 'private-object' } },
  ])(
    'rejects invalid configuration without exposing values (%j)',
    (overrides) => {
      let validationError: unknown;
      try {
        validateCloudwatchEnv({ ...enabledConfig, ...overrides });
      } catch (error) {
        validationError = error;
      }
      expect(validationError).toBeInstanceOf(Error);
      expect((validationError as Error).message).not.toContain('private-');
    },
  );
});
