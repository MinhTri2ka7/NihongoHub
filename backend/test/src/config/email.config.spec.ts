describe('email envConfig', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('EMAIL_ENABLED', 'true');
    vi.stubEnv('SMTP_HOST', 'smtp.example.com');
    vi.stubEnv('SMTP_PORT', '465');
    vi.stubEnv('SMTP_SECURE', 'true');
    vi.stubEnv('SMTP_USER', 'sender@example.com');
    vi.stubEnv('SMTP_PASS', 'test-only-password');
    vi.stubEnv('EMAIL_FROM', 'Example Team <sender@example.com>');
    vi.stubEnv('SMTP_TIMEOUT_MS', '1000');
    vi.stubEnv('AUTH_EMAIL_VERIFICATION_KEY', 'a'.repeat(64));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('maps SMTP configuration and a separate auth verification key', async () => {
    const { envConfig } = await import('../../../src/config/env.config.js');
    expect(envConfig.email).toMatchObject({
      enabled: true,
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      timeoutMs: 1000,
    });
    expect(envConfig.auth.emailVerificationKey).toHaveLength(64);
  });

  it('ignores SMTP details while disabled', async () => {
    vi.stubEnv('EMAIL_ENABLED', 'false');
    vi.stubEnv('SMTP_PORT', 'invalid-private-setting');
    vi.stubEnv('SMTP_HOST', 'invalid-private-setting');
    const { envConfig } = await import('../../../src/config/env.config.js');
    expect(envConfig.email).toMatchObject({
      enabled: false,
      pass: '',
      host: '',
    });
  });

  it.each([
    ['EMAIL_ENABLED', 'yes'],
    ['SMTP_HOST', 'private-host\r\nunsafe'],
    ['SMTP_PORT', '0'],
    ['SMTP_PORT', '65536'],
    ['SMTP_PORT', '1.5'],
    ['SMTP_SECURE', 'false'],
    ['SMTP_SECURE', 'unexpected'],
    ['SMTP_USER', ''],
    ['SMTP_PASS', ''],
    ['EMAIL_FROM', 'not-an-email'],
    ['EMAIL_FROM', 'sender@example.com\r\nBcc: another@example.com'],
    ['SMTP_TIMEOUT_MS', '0'],
    ['SMTP_TIMEOUT_MS', '120001'],
    ['AUTH_EMAIL_VERIFICATION_KEY', 'invalid-private-key'],
  ])('rejects invalid %s without echoing its value', async (key, value) => {
    vi.stubEnv(key, value);
    const result = import('../../../src/config/env.config.js');
    await expect(result).rejects.toThrow();
    if (value.length > 6) await expect(result).rejects.not.toThrow(value);
  });
});
