import { validateDatabaseEnv } from './database.config.js';

const url = 'postgresql://postgres:placeholder@localhost:5432/nihongo';

describe('database environment', () => {
  it('parses numeric settings and provides pool/timeouts defaults', () => {
    expect(
      validateDatabaseEnv({ DATABASE_URL: url, DATABASE_POOL_MAX: '20' }),
    ).toEqual({
      DATABASE_URL: url,
      DATABASE_POOL_MAX: 20,
      DATABASE_CONNECT_TIMEOUT_MS: 5000,
      DATABASE_IDLE_TIMEOUT_MS: 30000,
      DATABASE_QUERY_TIMEOUT_MS: 10000,
    });
  });

  it.each([
    undefined,
    '',
    'invalid',
    'mysql://localhost/db',
    'postgresql://localhost/',
  ])(
    'rejects invalid database URLs without including credentials (%s)',
    (DATABASE_URL) => {
      expect(() => validateDatabaseEnv({ DATABASE_URL })).toThrow(
        /DATABASE_URL/,
      );
    },
  );

  it.each([
    'DATABASE_POOL_MAX',
    'DATABASE_CONNECT_TIMEOUT_MS',
    'DATABASE_IDLE_TIMEOUT_MS',
    'DATABASE_QUERY_TIMEOUT_MS',
  ])('rejects invalid numeric settings for %s', (key) => {
    for (const value of ['', 'invalid', '0', '-1', '1.5', '2147483648']) {
      expect(() =>
        validateDatabaseEnv({ DATABASE_URL: url, [key]: value }),
      ).toThrow(key);
    }
  });
});
