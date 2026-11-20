export interface DatabaseEnvironment {
  DATABASE_URL: string;
  DATABASE_POOL_MAX: number;
  DATABASE_CONNECT_TIMEOUT_MS: number;
  DATABASE_IDLE_TIMEOUT_MS: number;
  DATABASE_QUERY_TIMEOUT_MS: number;
}

export function validateDatabaseEnv(
  config: Record<string, unknown>,
): DatabaseEnvironment {
  const url = config.DATABASE_URL;
  if (typeof url !== 'string' || !url.trim()) {
    throw new Error('DATABASE_URL is required');
  }
  try {
    const parsed = new URL(url);
    if (
      !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
      !parsed.hostname ||
      parsed.pathname.length < 2
    ) {
      throw new Error('Invalid database URL');
    }
  } catch {
    // Do not include the credential-bearing URL in validation errors.
    throw new Error(
      'DATABASE_URL must be a PostgreSQL URL with a host and database name',
    );
  }

  const positiveInteger = (key: string, fallback: number) => {
    const value = Number(config[key] ?? fallback);
    if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
      throw new Error(
        `${key} must be a positive integer no greater than 2147483647`,
      );
    }
    return value;
  };

  return {
    DATABASE_URL: url.trim(),
    DATABASE_POOL_MAX: positiveInteger('DATABASE_POOL_MAX', 10),
    DATABASE_CONNECT_TIMEOUT_MS: positiveInteger(
      'DATABASE_CONNECT_TIMEOUT_MS',
      5000,
    ),
    DATABASE_IDLE_TIMEOUT_MS: positiveInteger(
      'DATABASE_IDLE_TIMEOUT_MS',
      30000,
    ),
    DATABASE_QUERY_TIMEOUT_MS: positiveInteger(
      'DATABASE_QUERY_TIMEOUT_MS',
      10000,
    ),
  };
}
