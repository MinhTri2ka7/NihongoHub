import { Logger } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { HttpExceptionFilter } from '../../../../src/common/filters/http-exception.filter.js';
import type { CloudwatchLogService } from '../../../../src/infrastructure/cloudwatch/cloudwatch-log.service.js';

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
