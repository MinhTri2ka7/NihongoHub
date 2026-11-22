import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from '../../../src/health/health.service.js';
import type { DatabaseService } from '../../../src/infrastructure/database/database.service.js';
import { ErrorCode } from '../../../src/common/errors/error-code.js';

describe('HealthService', () => {
  const ping = vi.fn<() => Promise<void>>();
  let service: HealthService;

  beforeEach(() => {
    ping.mockReset().mockResolvedValue(undefined);
    service = new HealthService({ ping } as unknown as DatabaseService);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reports readiness only after the database probe completes', async () => {
    let completeProbe!: () => void;
    ping.mockReturnValue(
      new Promise<void>((resolve) => {
        completeProbe = resolve;
      }),
    );
    let completed = false;
    const readiness = service.ready().then((result) => {
      completed = true;
      return result;
    });
    await Promise.resolve();
    expect(completed).toBe(false);
    expect(ping).toHaveBeenCalledOnce();
    completeProbe();
    await expect(readiness).resolves.toEqual({
      status: 'ok',
      database: 'up',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
  });

  it('maps a failed database probe to the stable readiness error', async () => {
    const cause = new Error('private-database-connection');
    ping.mockRejectedValue(cause);
    const error: unknown = await service
      .ready()
      .catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(ServiceUnavailableException);
    if (!(error instanceof ServiceUnavailableException))
      throw new Error('Expected readiness error');
    expect(error.getStatus()).toBe(503);
    expect(error.errorCode).toBe(ErrorCode.DATABASE_UNAVAILABLE);
    expect(JSON.stringify(error.getResponse())).not.toContain(
      'private-database',
    );
    expect(ping).toHaveBeenCalledOnce();
  });

  it('keeps liveness independent from database availability', () => {
    ping.mockRejectedValue(new Error('database offline'));
    vi.spyOn(process, 'uptime').mockReturnValue(123.45);
    expect(service.check()).toEqual({
      status: 'ok',
      uptime: 123.45,
      timestamp: '2026-01-01T00:00:00.000Z',
    });
    expect(ping).not.toHaveBeenCalled();
  });
});
