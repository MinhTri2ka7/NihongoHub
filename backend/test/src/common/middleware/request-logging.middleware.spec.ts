import { EventEmitter } from 'node:events';
import type { Response } from 'express';
import { RequestLoggingMiddleware } from '../../../../src/common/middleware/request-logging.middleware.js';
import type { RequestWithId } from '../../../../src/common/middleware/request-logging.middleware.js';
import type { RequestLogService } from '../../../../src/common/logging/request-log.service.js';

describe('RequestLoggingMiddleware', () => {
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
      expect(next).toHaveBeenCalledOnce();
      expect(write).toHaveBeenCalledOnce();
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
