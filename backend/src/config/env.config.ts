import { config } from 'dotenv';

config({ path: ['.env.local', '.env'], quiet: true });

export const envConfig = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  requestLog: { directory: process.env.REQUEST_LOG_DIR ?? 'logs' },
  database: {
    url: process.env.DATABASE_URL ?? '',
    poolMax: Number(process.env.DATABASE_POOL_MAX ?? 10),
    connectTimeoutMs: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 5000),
    idleTimeoutMs: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30000),
    queryTimeoutMs: Number(process.env.DATABASE_QUERY_TIMEOUT_MS ?? 10000),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? '',
    expiresInSeconds: Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 900),
    issuer: process.env.JWT_ISSUER ?? 'nihongo-backend',
    audience: process.env.JWT_AUDIENCE ?? 'nihongo-client',
  },
  cloudwatch: {
    enabled: process.env.CLOUDWATCH_ENABLED === 'true',
    region: process.env.CLOUDWATCH_REGION ?? '',
    logGroup: process.env.CLOUDWATCH_LOG_GROUP ?? '',
    logStream: process.env.CLOUDWATCH_LOG_STREAM ?? '',
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            ...(process.env.AWS_SESSION_TOKEN
              ? { sessionToken: process.env.AWS_SESSION_TOKEN }
              : {}),
          }
        : undefined,
  },
  swagger: {
    enabled:
      process.env.SWAGGER_ENABLED === undefined
        ? process.env.NODE_ENV !== 'production'
        : process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH ?? 'docs',
    title: process.env.SWAGGER_TITLE ?? 'Nihongo API',
    version: process.env.SWAGGER_VERSION ?? '1.0.0',
  },
  observe: {
    appKey: process.env.OBSERVE_APP_KEY ?? '',
    appSecret: process.env.OBSERVE_APP_SECRET ?? '',
  },
};
