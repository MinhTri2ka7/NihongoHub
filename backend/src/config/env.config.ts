import { config } from 'dotenv';
import { isEmail } from 'class-validator';

config({ path: ['.env.local', '.env'], quiet: true });

function readEmailConfig() {
  const flag = process.env.EMAIL_ENABLED ?? 'false';
  if (!['true', 'false'].includes(flag))
    throw new Error('EMAIL_ENABLED must be true or false');
  const enabled = flag === 'true';
  const settings = {
    enabled,
    host: enabled ? (process.env.SMTP_HOST ?? '') : '',
    port: enabled ? Number(process.env.SMTP_PORT ?? 465) : 465,
    secure: enabled ? (process.env.SMTP_SECURE ?? 'true') === 'true' : true,
    user: enabled ? (process.env.SMTP_USER ?? '') : '',
    pass: enabled ? (process.env.SMTP_PASS ?? '') : '',
    from: enabled ? (process.env.EMAIL_FROM ?? '') : '',
    timeoutMs: enabled ? Number(process.env.SMTP_TIMEOUT_MS ?? 15000) : 15000,
  };
  if (!enabled) return settings;
  const sender =
    settings.from.match(/^[^<>\r\n]{1,100}<([^<>\r\n]+)>$/)?.[1] ??
    settings.from;
  if (
    !/^[A-Za-z0-9][A-Za-z0-9.-]*$/.test(settings.host) ||
    !Number.isSafeInteger(settings.port) ||
    settings.port < 1 ||
    settings.port > 65535 ||
    !['true', 'false'].includes(process.env.SMTP_SECURE ?? 'true') ||
    (settings.port === 465 && !settings.secure) ||
    !settings.user.trim() ||
    /[\r\n]/.test(settings.user) ||
    !settings.pass ||
    !isEmail(sender) ||
    /[\r\n]/.test(settings.from) ||
    !Number.isSafeInteger(settings.timeoutMs) ||
    settings.timeoutMs < 1 ||
    settings.timeoutMs > 120000
  )
    throw new Error('Email requires valid SMTP settings and sender');
  return settings;
}

function readEmailVerificationKey(): string {
  const key = process.env.AUTH_EMAIL_VERIFICATION_KEY ?? '';
  if (key && !/^[a-fA-F0-9]{64}$/.test(key)) {
    throw new Error('AUTH_EMAIL_VERIFICATION_KEY must be a 32-byte hex key');
  }
  return key;
}

function parseQueueUrls(value: string): Readonly<Record<string, string>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('SQS_QUEUE_URLS must be a JSON object of queue aliases');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('SQS_QUEUE_URLS must be a JSON object of queue aliases');
  }
  const entries = Object.entries(parsed);
  if (!entries.length) {
    throw new Error('SQS requires at least one queue alias');
  }
  const queueUrls: Record<string, string> = {};
  for (const [alias, queueUrl] of entries) {
    if (
      !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(alias) ||
      typeof queueUrl !== 'string'
    ) {
      throw new Error('SQS queue aliases and URLs must be valid');
    }
    try {
      const url = new URL(queueUrl);
      const name = url.pathname.split('/')[2] ?? '';
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.port ||
        queueUrl !== queueUrl.trim() ||
        !/^\/\d{12}\/[A-Za-z0-9_-]+$/.test(url.pathname) ||
        name.length > 80
      ) {
        throw new Error('Invalid queue URL');
      }
    } catch {
      throw new Error('SQS queue URLs must be valid HTTPS queue URLs');
    }
    queueUrls[alias] = queueUrl;
  }
  return Object.freeze(queueUrls);
}

export const envConfig = {
  email: readEmailConfig(),
  auth: { emailVerificationKey: readEmailVerificationKey() },
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
  s3: {
    enabled: process.env.S3_ENABLED === 'true',
    region: process.env.S3_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-1',
    bucket: process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET ?? '',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    timeoutMs: Number(process.env.S3_TIMEOUT_MS ?? 5000),
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            ...(process.env.S3_SESSION_TOKEN
              ? { sessionToken: process.env.S3_SESSION_TOKEN }
              : {}),
          }
        : undefined,
  },
  queue: {
    enabled: process.env.SQS_ENABLED === 'true',
    region: process.env.SQS_REGION ?? process.env.AWS_REGION ?? '',
    timeoutMs: Number(process.env.SQS_TIMEOUT_MS ?? 5000),
    queueUrls:
      process.env.SQS_ENABLED === 'true'
        ? parseQueueUrls(process.env.SQS_QUEUE_URLS ?? '{}')
        : ({} as Readonly<Record<string, string>>),
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
