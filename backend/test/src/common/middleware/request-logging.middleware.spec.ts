import { EventEmitter } from 'node:events';
import type { Response } from 'express';
import { RequestLoggingMiddleware } from '../../../../src/common/middleware/request-logging.middleware.js';
import type { RequestWithId } from '../../../../src/common/middleware/request-logging.middleware.js';
import type { RequestLogService } from '../../../../src/common/logging/request-log.service.js';

describe('RequestLoggingMiddleware', () => {
  it.each([
    { label: 'one character', incomingId: 'a', accepted: true },
    { label: 'maximum length', incomingId: 'a'.repeat(128), accepted: true },
    {
      label: 'allowed punctuation',
      incomingId: 'client.request_1:trace-2',
      accepted: true,
    },
    { label: 'missing', incomingId: undefined, accepted: false },
    { label: 'empty', incomingId: '', accepted: false },
    { label: 'too long', incomingId: 'a'.repeat(129), accepted: false },
    { label: 'whitespace', incomingId: 'invalid id', accepted: false },
    { label: 'newline', incomingId: 'invalid\nid', accepted: false },
    { label: 'non-ASCII', incomingId: 'mã-request', accepted: false },
    {
      label: 'multiple values',
      incomingId: ['first', 'second'],
      accepted: false,
    },
  ])(
    'correlates the header, request and access log for $label IDs',
    ({ incomingId, accepted }) => {
      const write = vi.fn();
      const middleware = new RequestLoggingMiddleware({
        write,
      } as unknown as RequestLogService);
      const request = {
        headers: { 'x-request-id': incomingId },
        method: 'GET',
        route: { path: '/protected' },
      } as unknown as RequestWithId;
      const response = Object.assign(new EventEmitter(), {
        setHeader: vi.fn(),
        writableFinished: true,
        statusCode: 403,
      });
      const next = vi.fn();
      middleware.use(request, response as unknown as Response, next);
      if (accepted) {
        expect(request.request_id).toBe(incomingId);
      } else {
        expect(request.request_id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
      }
      expect(response.setHeader).toHaveBeenCalledWith(
        'X-Request-Id',
        request.request_id,
      );
      expect(next).toHaveBeenCalledOnce();
      expect(write).not.toHaveBeenCalled();
      response.emit('finish');
      expect(write).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          request_id: request.request_id,
          status_code: 403,
          aborted: false,
          duration_ms: expect.any(Number),
        }),
      );
      expect(write.mock.calls[0][0].duration_ms).toBeGreaterThanOrEqual(0);
    },
  );

  it.each([true, false])(
    'logs once on completion (finished=%s) without raw path data',
    (finished) => {
      const write = vi.fn();
      const middleware = new RequestLoggingMiddleware({
        write,
      } as unknown as RequestLogService);
      const request = {
        headers: {},
        method: 'GET',
        originalUrl: '/private-token?secret=private-query',
        baseUrl: '/private-mount',
      } as RequestWithId;
      const response = Object.assign(new EventEmitter(), {
        setHeader: vi.fn(),
        writableFinished: finished,
        statusCode: 200,
      });
      const next = vi.fn();
      middleware.use(request, response as unknown as Response, next);
      if (finished) {
        request.route = { path: '/:token' };
      }
      response.emit(finished ? 'finish' : 'close');
      response.emit('close');
      response.emit('finish');
      expect(next).toHaveBeenCalledOnce();
      expect(write).toHaveBeenCalledOnce();
      expect(response.listenerCount('finish')).toBe(0);
      expect(response.listenerCount('close')).toBe(0);
      expect(write).toHaveBeenCalledWith(
        expect.objectContaining({
          path: finished ? '/:token' : '[unmatched]',
          status_code: finished ? 200 : 499,
          aborted: !finished,
        }),
      );
      expect(JSON.stringify(write.mock.calls)).not.toContain('private-');
    },
  );
});
