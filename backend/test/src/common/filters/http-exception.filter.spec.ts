import {
  BadRequestException,
  Controller,
  Get,
  HttpException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ErrorCode } from '../../../../src/common/errors/error-code.js';
import { RequestLoggingMiddleware } from '../../../../src/common/middleware/request-logging.middleware.js';
import type { RequestLogService } from '../../../../src/common/logging/request-log.service.js';
import { HttpExceptionFilter } from '../../../../src/common/filters/http-exception.filter.js';
import type { CloudwatchLogService } from '../../../../src/infrastructure/cloudwatch/cloudwatch-log.service.js';

let routeError: unknown;

@Controller('filter-test')
class FilterTestController {
  @Get()
  fail() {
    throw routeError;
  }
}

describe('HTTP exception contract through a route', () => {
  let app: INestApplication;
  const writeLog = vi.fn();
  const requestLog = { write: vi.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [FilterTestController],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    const middleware = new RequestLoggingMiddleware(
      requestLog as unknown as RequestLogService,
    );
    app.use(middleware.use.bind(middleware));
    app.useGlobalFilters(
      new HttpExceptionFilter(app.get(HttpAdapterHost), {
        writeLog,
      } as unknown as CloudwatchLogService),
    );
    await app.init();
  });

  beforeEach(() => {
    writeLog.mockClear();
    requestLog.write.mockClear();
  });
  afterAll(async () => {
    await app.close();
  });

  it.each([
    {
      label: 'string body',
      error: new HttpException('Invalid selection', 400),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid selection',
      details: [],
    },
    {
      label: 'validation messages',
      error: new BadRequestException(['name is required', 'email is invalid']),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Bad Request',
      details: ['name is required', 'email is invalid'],
    },
    {
      label: 'explicit public details',
      error: new BadRequestException({
        message: 'Invalid input',
        details: ['Choose an allowed value'],
      }),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid input',
      details: ['Choose an allowed value'],
    },
    {
      label: 'object details',
      error: new BadRequestException({
        message: 'Invalid input',
        details: { sql: 'private-sql' },
      }),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid input',
      details: [],
    },
    {
      label: 'mixed details',
      error: new BadRequestException({
        message: 'Invalid input',
        details: ['safe', { secret: 'private-secret' }],
      }),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid input',
      details: [],
    },
    {
      label: 'invalid message type',
      error: new BadRequestException({ message: 123 }),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Bad Request',
      details: [],
    },
    {
      label: 'mixed validation messages',
      error: new BadRequestException({ message: ['safe', 123] }),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Bad Request',
      details: [],
    },
    {
      label: 'missing message',
      error: new BadRequestException({ other: 'private-field' }),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Bad Request',
      details: [],
    },
    {
      label: 'registered body code',
      error: new NotFoundException({
        code: ErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      }),
      status: 404,
      code: ErrorCode.USER_NOT_FOUND,
      message: 'User not found',
      details: [],
    },
    {
      label: 'registered option code',
      error: new NotFoundException('User not found', {
        errorCode: ErrorCode.USER_NOT_FOUND,
      }),
      status: 404,
      code: ErrorCode.USER_NOT_FOUND,
      message: 'User not found',
      details: [],
    },
    {
      label: 'unknown body code',
      error: new BadRequestException({
        code: 'UNREGISTERED',
        message: 'Invalid input',
      }),
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Invalid input',
      details: [],
    },
    {
      label: 'HTTP adapter error',
      error: { statusCode: 400, message: 'private-parser-input' },
      status: 400,
      code: ErrorCode.BAD_REQUEST,
      message: 'Bad Request',
      details: [],
    },
  ])(
    'normalizes $label without changing HTTP status',
    async ({ error, status, code, message, details }) => {
      routeError = error;
      const response = await request(app.getHttpServer())
        .get('/filter-test')
        .set('X-Request-Id', 'filter-test-id')
        .expect(status);
      expect(response.body).toEqual({
        code,
        message,
        details,
        requestId: 'filter-test-id',
      });
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
      expect(writeLog).not.toHaveBeenCalled();
      expect(JSON.stringify(response.body)).not.toContain('private-');
    },
  );

  it.each([
    {
      label: 'unexpected error',
      error: new Error('private-database-password'),
      status: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    },
    {
      label: 'unavailable upstream',
      error: new ServiceUnavailableException(
        { message: 'private-upstream-url', details: ['private-secret'] },
        { errorCode: ErrorCode.AUTH_PROVIDER_UNAVAILABLE },
      ),
      status: 503,
      code: ErrorCode.AUTH_PROVIDER_UNAVAILABLE,
      message: 'Service Unavailable',
    },
    {
      label: 'thrown string',
      error: 'private-thrown-value',
      status: 500,
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
    },
  ])(
    'hides sensitive $label information from response and external logs',
    async ({ error, status, code, message }) => {
      routeError = error;
      const response = await request(app.getHttpServer())
        .get('/filter-test')
        .expect(status);
      expect(response.body).toEqual({
        code,
        message,
        details: [],
        requestId: response.headers['x-request-id'],
      });
      expect(writeLog.mock.calls).toEqual([
        [JSON.stringify({ method: 'GET', status })],
      ]);
      expect(JSON.stringify(response.body)).not.toContain('private-');
      expect(JSON.stringify(requestLog.write.mock.calls)).not.toContain(
        'private-',
      );
    },
  );

  it('hides an unmatched URL and correlates its error with the response header', async () => {
    const response = await request(app.getHttpServer())
      .get('/private-token?secret=private-query')
      .expect(404);
    expect(response.body).toEqual({
      code: ErrorCode.NOT_FOUND,
      message: 'Not Found',
      details: [],
      requestId: response.headers['x-request-id'],
    });
    expect(JSON.stringify(response.body)).not.toContain('private-');
    expect(requestLog.write).toHaveBeenCalledWith(
      expect.objectContaining({
        request_id: response.body.requestId,
        path: '[unmatched]',
        status_code: 404,
      }),
    );
  });
});

describe('HttpExceptionFilter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('ends an already started response and logs only method and status', () => {
    const adapter = {
      getRequestMethod: vi.fn(() => 'GET'),
      getRequestUrl: vi.fn(() => '/private-path'),
      isHeadersSent: vi.fn(() => true),
      end: vi.fn(),
      reply: vi.fn(),
    };
    const response = {};
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => ({ request_id: 'private-request' }),
        getResponse: () => response,
      }),
    } as unknown as ArgumentsHost;
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const writeLog = vi.fn();
    const filter = new HttpExceptionFilter(
      {
        httpAdapter: adapter,
      } as unknown as HttpAdapterHost,
      { writeLog } as unknown as CloudwatchLogService,
    );
    filter.catch(
      new Error('private-message', { cause: new Error('private-cause') }),
      host,
    );
    expect(log.mock.calls).toEqual([[{ method: 'GET', status: 500 }]]);
    expect(writeLog.mock.calls).toEqual([
      [JSON.stringify({ method: 'GET', status: 500 })],
    ]);
    expect(adapter.getRequestUrl).not.toHaveBeenCalled();
    expect(adapter.reply).not.toHaveBeenCalled();
    expect(adapter.end).toHaveBeenCalledWith(response);
  });

  it('propagates non-HTTP errors without logging their contents', () => {
    const writeLog = vi.fn();
    const filter = new HttpExceptionFilter(
      {} as HttpAdapterHost,
      { writeLog } as unknown as CloudwatchLogService,
    );
    const error = new Error('private-message');
    const log = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    expect(() =>
      filter.catch(error, { getType: () => 'rpc' } as ArgumentsHost),
    ).toThrow(error);
    expect(log).not.toHaveBeenCalled();
    expect(writeLog).not.toHaveBeenCalled();
  });
});
