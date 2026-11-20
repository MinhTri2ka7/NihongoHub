import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  Controller,
  Get,
  INestApplication,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { AppService } from './../src/app.service.js';
import { ErrorCode } from './../src/common/errors/error-code.js';
import { setupRequestLogging } from './../src/bootstrap/logging.js';
import { RequestLogService } from './../src/common/logging/request-log.service.js';
import { envConfig } from '../src/config/env.config.js';
import { mkdtemp, readdir, readFile, unlink, rmdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getDrizzleToken } from '@nestjs/drizzle';

const defaultRequestLog = envConfig.requestLog;

@Controller('security-test')
class SecurityTestController {
  @Get(':token/fail')
  fail() {
    throw new Error('private-sql-and-credentials', {
      cause: new Error('private-cause'),
    });
  }

  @Get(':token')
  get() {
    return { ok: true };
  }
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let logDirectory: string;
  const database = { execute: vi.fn() };

  beforeEach(async () => {
    database.execute
      .mockReset()
      .mockResolvedValue({ rows: [{ '?column?': 1 }] });
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [SecurityTestController],
    })
      .overrideProvider(getDrizzleToken())
      .useValue(database)
      .compile();

    app = moduleFixture.createNestApplication();
    logDirectory = await mkdtemp(join(tmpdir(), 'nihongo-request-log-'));
    envConfig.requestLog = {
      directory: logDirectory,
    };
    setupRequestLogging(app);
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('returns a consistent response for missing routes without echoing query values', async () => {
    const response = await request(app.getHttpServer())
      .get('/missing?token=private')
      .expect(404);
    expect(response.body).toEqual({
      statusCode: 404,
      request_id: response.headers['x-request-id'],
      code: ErrorCode.NOT_FOUND,
      message: expect.any(String),
      timestamp: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
  });

  it('preserves validation messages and the HTTP status', async () => {
    vi.spyOn(app.get(AppService), 'getHello').mockImplementation(() => {
      throw new BadRequestException([
        'email must be valid',
        'name is required',
      ]);
    });
    const response = await request(app.getHttpServer()).get('/').expect(400);
    expect(response.body.message).toEqual([
      'email must be valid',
      'name is required',
    ]);
    expect(response.body.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it.each([
    {
      error: new Error('internal database password'),
      status: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    },
    {
      error: new ServiceUnavailableException('private upstream URL'),
      status: 503,
      code: ErrorCode.SERVICE_UNAVAILABLE,
      message: 'Service Unavailable',
    },
    {
      error: 'unexpected thrown value',
      status: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    },
  ])(
    'logs and hides server error details ($status)',
    async ({ error, status, code, message }) => {
      const log = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      vi.spyOn(app.get(AppService), 'getHello').mockImplementation(() => {
        throw error;
      });
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(status);
      expect(response.body).toEqual({
        statusCode: status,
        request_id: response.headers['x-request-id'],
        code,
        message,
        timestamp: expect.any(String),
      });
      expect(log.mock.calls).toEqual([[{ method: 'GET', status }]]);
    },
  );

  it('keeps malformed JSON as a client error', async () => {
    const response = await request(app.getHttpServer())
      .post('/')
      .set('Content-Type', 'application/json')
      .send('{ invalid json')
      .expect(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      code: ErrorCode.BAD_REQUEST,
      message: expect.any(String),
    });
  });

  it.each([
    new NotFoundException({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'User not found',
    }),
    new NotFoundException('User not found', {
      errorCode: ErrorCode.USER_NOT_FOUND,
    }),
  ])(
    'uses a registered application code from exception bodies or options',
    async (error) => {
      vi.spyOn(app.get(AppService), 'getHello').mockImplementation(() => {
        throw error;
      });
      const response = await request(app.getHttpServer()).get('/').expect(404);
      expect(response.body).toMatchObject({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    },
  );

  it('falls back to the HTTP code when a custom code is not registered', async () => {
    vi.spyOn(app.get(AppService), 'getHello').mockImplementation(() => {
      throw new BadRequestException({
        code: 'UNREGISTERED',
        message: 'Invalid input',
      });
    });
    const response = await request(app.getHttpServer()).get('/').expect(400);
    expect(response.body.code).toBe(ErrorCode.BAD_REQUEST);
  });

  it('preserves registered server error codes while hiding internal messages', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    vi.spyOn(app.get(AppService), 'getHello').mockImplementation(() => {
      throw new ServiceUnavailableException('private upstream URL', {
        errorCode: ErrorCode.AUTH_PROVIDER_UNAVAILABLE,
      });
    });
    const response = await request(app.getHttpServer()).get('/').expect(503);
    expect(response.body).toMatchObject({
      code: ErrorCode.AUTH_PROVIDER_UNAVAILABLE,
      message: 'Service Unavailable',
    });
  });

  it('persists a request log with the returned request ID and redacts query values', async () => {
    const response = await request(app.getHttpServer())
      .get('/health?token=private')
      .expect(200);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    await app.get(RequestLogService).flush();
    const [file] = await readdir(logDirectory);
    const content = await readFile(join(logDirectory, file), 'utf8');
    expect(JSON.parse(content.trim())).toMatchObject({
      request_id: response.headers['x-request-id'],
      method: 'GET',
      path: '/health',
      status_code: 200,
      duration_ms: expect.any(Number),
      aborted: false,
    });
    expect(content).not.toContain('private');
  });

  it('correlates malformed JSON errors with the request log', async () => {
    const response = await request(app.getHttpServer())
      .post('/')
      .set('X-Request-Id', 'client-request-123')
      .set('Content-Type', 'application/json')
      .send('{ broken')
      .expect(400);
    expect(response.body.request_id).toBe('client-request-123');
    expect(response.headers['x-request-id']).toBe('client-request-123');
    await app.get(RequestLogService).flush();
    const [file] = await readdir(logDirectory);
    expect(
      JSON.parse((await readFile(join(logDirectory, file), 'utf8')).trim()),
    ).toMatchObject({
      request_id: 'client-request-123',
      status_code: 400,
      path: '[unmatched]',
    });
  });

  it('records route templates without path parameters or query values', async () => {
    const response = await request(app.getHttpServer())
      .get('/security-test/private-path?token=private-query')
      .expect(200);
    await app.get(RequestLogService).flush();
    const [file] = await readdir(logDirectory);
    const content = await readFile(join(logDirectory, file), 'utf8');
    expect(JSON.parse(content.trim())).toMatchObject({
      path: '/security-test/:token',
      request_id: response.headers['x-request-id'],
    });
    expect(content).not.toContain('private-');
  });

  it('does not echo unmatched URLs in error messages or request logs', async () => {
    const response = await request(app.getHttpServer())
      .get('/missing/private-path?token=private-query')
      .expect(404);
    expect(response.body.message).toBe('Not Found');
    expect(response.body).not.toHaveProperty('path');
    expect(JSON.stringify(response.body)).not.toContain('private-');
    await app.get(RequestLogService).flush();
    const [file] = await readdir(logDirectory);
    const content = await readFile(join(logDirectory, file), 'utf8');
    expect(JSON.parse(content.trim()).path).toBe('[unmatched]');
    expect(content).not.toContain('private-');
  });

  it('logs only method and status for server errors with sensitive causes', async () => {
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const response = await request(app.getHttpServer())
      .get('/security-test/private-path/fail?token=private-query')
      .expect(500);
    expect(log.mock.calls).toEqual([[{ method: 'GET', status: 500 }]]);
    expect(response.body).not.toHaveProperty('path');
    expect(response.body.message).toBe('Internal Server Error');
    expect(JSON.stringify(response.body)).not.toContain('private-');
  });

  it('does not echo submitted JSON fragments in parser errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/missing/private-path')
      .set('Content-Type', 'application/json')
      .send('{"token":"private-body", invalid}')
      .expect(400);
    expect(response.body.message).toBe('Bad Request');
    expect(response.body).not.toHaveProperty('path');
    expect(JSON.stringify(response.body)).not.toContain('private-');
  });

  it('replaces invalid incoming request IDs', async () => {
    const response = await request(app.getHttpServer())
      .get('/')
      .set('X-Request-Id', 'invalid id')
      .expect(200);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reports database readiness after a successful query', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);
    expect(response.body).toMatchObject({ status: 'ok', database: 'up' });
    expect(database.execute).toHaveBeenCalledTimes(2); // Startup and readiness.
  });

  it('reports database outages while preserving liveness', async () => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    database.execute.mockRejectedValue(new Error('private database failure'));
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(503);
    expect(response.body).toMatchObject({
      code: ErrorCode.DATABASE_UNAVAILABLE,
      message: 'Service Unavailable',
    });
    expect(JSON.stringify(response.body)).not.toContain('private');
    await request(app.getHttpServer()).get('/health').expect(200);
  });

  afterEach(async () => {
    envConfig.requestLog = defaultRequestLog;
    vi.restoreAllMocks();
    await app.close();
    for (const file of await readdir(logDirectory)) {
      await unlink(join(logDirectory, file));
    }
    await rmdir(logDirectory);
  });
});
