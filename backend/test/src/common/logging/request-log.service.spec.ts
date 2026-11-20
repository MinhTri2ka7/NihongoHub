import { Logger } from '@nestjs/common';
import { appendFile, mkdir } from 'node:fs/promises';
import { RequestLogService } from '../../../../src/common/logging/request-log.service.js';
import type { EnvConfigService } from '../../../../src/config/env-config.service.js';
import type { CloudwatchLogService } from '../../../../src/infrastructure/cloudwatch/cloudwatch-log.service.js';

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  appendFile: vi.fn(),
}));

describe('RequestLogService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
  });

  it.each(['mkdir', 'appendFile'])(
    'hides %s failures and continues writing',
    async (operation) => {
      vi.mocked(mkdir).mockResolvedValue(undefined);
      vi.mocked(appendFile).mockResolvedValue(undefined);
      const error = new Error('private-directory-and-credentials', {
        cause: new Error('private-cause'),
      });
      if (operation === 'mkdir') {
        vi.mocked(mkdir).mockRejectedValueOnce(error);
      } else {
        vi.mocked(appendFile).mockRejectedValueOnce(error);
      }
      vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
      const log = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);
      const writeLog = vi.fn();
      const service = new RequestLogService(
        {
          requestLog: { directory: 'private-directory' },
        } as EnvConfigService,
        { writeLog } as unknown as CloudwatchLogService,
      );
      const entry = {
        timestamp: '2026-11-20T00:00:00.000Z',
        request_id: 'test-request',
        method: 'GET',
        path: '/health',
        status_code: 200,
        duration_ms: 1,
        aborted: false,
      };
      service.write(entry);
      expect(writeLog).toHaveBeenCalledWith(JSON.stringify(entry));
      await expect(service.flush()).resolves.toBeUndefined();
      expect(log.mock.calls).toEqual([['Unable to write request log']]);
      service.write(entry);
      await service.onApplicationShutdown();
      expect(appendFile).toHaveBeenLastCalledWith(
        expect.any(String),
        `${JSON.stringify(entry)}\n`,
        'utf8',
      );
      expect(log).toHaveBeenCalledTimes(1);
    },
  );
});
