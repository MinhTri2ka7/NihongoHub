import { Logger } from '@nestjs/common';
import {
  CreateLogStreamCommand,
  PutLogEventsCommand,
  ResourceAlreadyExistsException,
} from '@aws-sdk/client-cloudwatch-logs';
import { CloudwatchLogService } from '../../../../src/infrastructure/cloudwatch/cloudwatch-log.service.js';
import type { EnvConfigService } from '../../../../src/config/env-config.service.js';

const aws = vi.hoisted(() => ({
  send: vi.fn(),
  destroy: vi.fn(),
  options: vi.fn(),
}));

vi.mock('@aws-sdk/client-cloudwatch-logs', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@aws-sdk/client-cloudwatch-logs')>();
  return {
    ...actual,
    CloudWatchLogsClient: class {
      constructor(options: unknown) {
        aws.options(options);
      }
      send = aws.send;
      destroy = aws.destroy;
    },
  };
});

function createService(enabled = true) {
  return new CloudwatchLogService({
    cloudwatch: {
      enabled,
      region: 'ap-southeast-1',
      logGroup: '/nihongo/backend/test',
      logStream: 'local-test',
      credentials: undefined,
    },
  } as EnvConfigService);
}

describe('CloudwatchLogService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-20T00:00:00Z'));
    vi.resetAllMocks();
    aws.send.mockResolvedValue({});
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('makes no SDK client, timer or AWS calls when disabled', async () => {
    const service = createService(false);
    service.onModuleInit();
    service.writeLog('test');
    await service.flush();
    await service.onApplicationShutdown();
    expect(aws.options).not.toHaveBeenCalled();
    expect(aws.send).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('creates a stream and sends chronologically sorted batches with bounded retries', async () => {
    const service = createService();
    service.writeLog('later');
    vi.setSystemTime(new Date('2026-11-19T23:59:59Z'));
    service.writeLog('earlier');
    await service.flush();
    expect(aws.options).toHaveBeenCalledWith(
      expect.objectContaining({
        maxAttempts: 3,
        requestHandler: { connectionTimeout: 1000, requestTimeout: 3000 },
      }),
    );
    expect(aws.send.mock.calls[0][0]).toBeInstanceOf(CreateLogStreamCommand);
    const command = aws.send.mock.calls[1][0] as PutLogEventsCommand;
    expect(command).toBeInstanceOf(PutLogEventsCommand);
    expect(command.input).toEqual({
      logGroupName: '/nihongo/backend/test',
      logStreamName: 'local-test',
      logEvents: [
        { message: 'earlier', timestamp: Date.now() },
        { message: 'later', timestamp: Date.now() + 1000 },
      ],
    });
    expect(aws.send.mock.calls[1][1].abortSignal).toBeInstanceOf(AbortSignal);
    service.writeLog('next');
    await service.flush();
    expect(
      aws.send.mock.calls.filter(
        ([command]) => command instanceof CreateLogStreamCommand,
      ),
    ).toHaveLength(1);
    await service.onApplicationShutdown();
    expect(aws.destroy).toHaveBeenCalledOnce();
  });

  it('uses an existing stream without sequence tokens', async () => {
    aws.send.mockRejectedValueOnce(
      new ResourceAlreadyExistsException({
        message: 'private-error',
        $metadata: {},
      }),
    );
    const service = createService();
    service.writeLog('safe-message');
    await service.flush();
    expect(
      (aws.send.mock.calls[1][0] as PutLogEventsCommand).input,
    ).not.toHaveProperty('sequenceToken');
    expect(Logger.prototype.error).not.toHaveBeenCalled();
  });

  it.each(['create', 'put'])(
    'contains %s failures and allows future batches',
    async (operation) => {
      const error = new Error('private-credentials-and-sql', {
        cause: new Error('private-cause'),
      });
      if (operation === 'create') {
        aws.send.mockRejectedValueOnce(error);
      } else {
        aws.send.mockResolvedValueOnce({}).mockRejectedValueOnce(error);
      }
      const service = createService();
      service.writeLog('first');
      await expect(service.flush()).resolves.toBeUndefined();
      expect(vi.mocked(Logger.prototype.error).mock.calls).toEqual([
        ['Unable to send CloudWatch logs'],
      ]);
      service.writeLog('second');
      await service.flush();
      const lastCommand = aws.send.mock.calls.at(-1)![0] as PutLogEventsCommand;
      expect(lastCommand.input.logEvents?.[0].message).toBe('second');
    },
  );

  it('shares an in-flight flush and drains messages queued during the send', async () => {
    let finishSend!: (value: object) => void;
    const held = new Promise((resolve) => {
      finishSend = resolve;
    });
    aws.send.mockResolvedValueOnce({}).mockReturnValueOnce(held);
    const service = createService();
    service.writeLog('first');
    const firstFlush = service.flush();
    expect(service.flush()).toBe(firstFlush);
    service.writeLog('second');
    await Promise.resolve();
    finishSend({});
    await firstFlush;
    const batches = aws.send.mock.calls
      .filter(([command]) => command instanceof PutLogEventsCommand)
      .map(([command]) => (command as PutLogEventsCommand).input.logEvents);
    expect(
      batches.map((batch) => batch?.map((event) => event.message)),
    ).toEqual([['first'], ['second']]);
  });

  it('bounds the number of buffered events and warns once on overflow', async () => {
    const service = createService();
    for (let index = 0; index < 1100; index++) {
      service.writeLog('event');
    }
    expect(Logger.prototype.warn).toHaveBeenCalledOnce();
    await service.flush();
    expect(
      (aws.send.mock.calls[1][0] as PutLogEventsCommand).input.logEvents,
    ).toHaveLength(1000);
  });

  it('bounds UTF-8 bytes including event overhead and rejects oversized events', async () => {
    const service = createService();
    service.writeLog('é'.repeat(150_000));
    for (let index = 0; index < 5; index++) {
      service.writeLog('é'.repeat(120_000));
    }
    await service.flush();
    const events = (aws.send.mock.calls[1][0] as PutLogEventsCommand).input
      .logEvents!;
    expect(events).toHaveLength(4);
    expect(
      events.reduce(
        (bytes, event) =>
          bytes + Buffer.byteLength(event.message!, 'utf8') + 26,
        0,
      ),
    ).toBeLessThanOrEqual(1_048_576);
  });

  it('splits batches that span more than 24 hours', async () => {
    const service = createService();
    service.writeLog('older');
    vi.setSystemTime(new Date('2026-11-22T00:00:00Z'));
    service.writeLog('newer');
    await service.flush();
    expect(
      aws.send.mock.calls.filter(
        ([command]) => command instanceof PutLogEventsCommand,
      ),
    ).toHaveLength(2);
  });

  it('reports partial rejections without logging the AWS response', async () => {
    aws.send.mockResolvedValueOnce({}).mockResolvedValueOnce({
      rejectedLogEventsInfo: { tooOldLogEventEndIndex: 0 },
      privateMetadata: 'private-value',
    });
    const service = createService();
    service.writeLog('old');
    await service.flush();
    expect(vi.mocked(Logger.prototype.warn).mock.calls).toEqual([
      ['CloudWatch rejected log events'],
    ]);
  });

  it('flushes on the timer and drains remaining events on shutdown', async () => {
    const service = createService();
    service.onModuleInit();
    service.writeLog('periodic');
    await vi.advanceTimersByTimeAsync(1000);
    expect(aws.send).toHaveBeenCalledTimes(2);
    service.writeLog('shutdown');
    await service.onApplicationShutdown();
    expect(aws.send).toHaveBeenCalledTimes(3);
    service.writeLog('after-shutdown');
    await vi.advanceTimersByTimeAsync(1000);
    expect(aws.send).toHaveBeenCalledTimes(3);
    expect(aws.destroy).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
