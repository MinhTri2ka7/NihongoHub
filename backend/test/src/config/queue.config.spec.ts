describe('queue envConfig mapping', () => {
  const keys = [
    'SQS_ENABLED',
    'SQS_REGION',
    'SQS_QUEUE_URLS',
    'SQS_TIMEOUT_MS',
    'AWS_REGION',
  ] as const;
  const originalValues = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );

  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('SQS_ENABLED', 'true');
    vi.stubEnv('SQS_REGION', 'ap-southeast-1');
    vi.stubEnv('SQS_TIMEOUT_MS', '1000');
    vi.stubEnv(
      'SQS_QUEUE_URLS',
      '{"example":"https://sqs.ap-southeast-1.amazonaws.com/000000000000/example"}',
    );
  });

  afterEach(() => {
    for (const key of keys) vi.stubEnv(key, originalValues[key]);
    vi.resetModules();
  });

  it('reads multiple queue URLs and preserves case through a frozen map', async () => {
    vi.stubEnv(
      'SQS_QUEUE_URLS',
      JSON.stringify({
        first:
          'https://sqs.ap-southeast-1.amazonaws.com/000000000000/CaseSensitive',
        second: 'https://sqs.ap-southeast-1.amazonaws.com/000000000000/events',
      }),
    );
    const { envConfig } = await import('../../../src/config/env.config.js');
    expect(envConfig.queue.queueUrls).toEqual({
      first:
        'https://sqs.ap-southeast-1.amazonaws.com/000000000000/CaseSensitive',
      second: 'https://sqs.ap-southeast-1.amazonaws.com/000000000000/events',
    });
    expect(Object.isFrozen(envConfig.queue.queueUrls)).toBe(true);
  });

  it('falls back to AWS_REGION', async () => {
    vi.stubEnv('SQS_REGION', undefined);
    vi.stubEnv('AWS_REGION', 'us-east-1');
    const { envConfig } = await import('../../../src/config/env.config.js');
    expect(envConfig.queue.region).toBe('us-east-1');
  });

  it('ignores queue settings when disabled', async () => {
    vi.stubEnv('SQS_ENABLED', 'false');
    vi.stubEnv('SQS_QUEUE_URLS', 'malformed-private-data');
    const { envConfig } = await import('../../../src/config/env.config.js');
    expect(envConfig.queue).toMatchObject({ enabled: false, queueUrls: {} });
  });

  it.each([
    '{private-invalid-json',
    '{"example":"https://sqs.ap-southeast-1.amazonaws.com/000000000000/unsupported.fifo"}',
    '[]',
    'null',
    '42',
    '{}',
    '{"bad alias":"private-url"}',
    '{"example":42}',
    '{"example":"http://private-host/000000000000/queue"}',
    '{"example":"https://private-host/not-a-queue"}',
    '{"example":"https://private-host/000000000000/queue?secret=private-value"}',
    '{"example":"https://user:private-value@private-host/000000000000/queue"}',
  ])(
    'rejects unsafe configuration without disclosing its content',
    async (value) => {
      vi.stubEnv('SQS_QUEUE_URLS', value);
      const error: unknown =
        await import('../../../src/config/env.config.js').then(
          () => undefined,
          (failure: unknown) => failure,
        );
      expect(error).toBeInstanceOf(Error);
      if (!(error instanceof Error)) throw new Error('Expected config to fail');
      expect(error.message).not.toMatch(/private|secret=/);
    },
  );
});
