import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { envConfig } from '../../../../src/config/env.config.js';
import { ErrorCode } from '../../../../src/common/errors/error-code.js';
import { SqsModule } from '../../../../src/infrastructure/queue/sqs.module.js';
import { SqsMessageService } from '../../../../src/infrastructure/queue/sqs-message.service.js';
import { SQS_CLIENT } from '../../../../src/infrastructure/queue/sqs.tokens.js';

describe('SQS queue sender', () => {
  const originalSettings = envConfig.queue;
  const queueUrls = {
    first: 'https://sqs.ap-southeast-1.amazonaws.com/000000000000/first',
    second: 'https://sqs.ap-southeast-1.amazonaws.com/000000000000/second',
  };
  let module: TestingModule | undefined;

  beforeEach(() => {
    envConfig.queue = {
      enabled: true,
      region: 'ap-southeast-1',
      timeoutMs: 1000,
      queueUrls,
    };
  });

  afterEach(async () => {
    await module?.close();
    module = undefined;
    envConfig.queue = originalSettings;
    vi.restoreAllMocks();
  });

  async function createSender() {
    module = await Test.createTestingModule({ imports: [SqsModule] }).compile();
    await module.init();
    return module.get(SqsMessageService);
  }

  it('routes messages by configured aliases and sends JSON through the shared client', async () => {
    const send = vi
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(async () => ({ MessageId: 'message-id' }));
    const sender = await createSender();
    await expect(sender.sendMessage('first', 'hello')).resolves.toEqual({
      messageId: 'message-id',
    });
    await sender.sendJsonMessage('second', {
      documentId: 'test-document',
      text: '日本語',
    });
    const commands = send.mock.calls.map(
      ([command]) => (command as SendMessageCommand).input,
    );
    expect(commands).toEqual([
      { QueueUrl: queueUrls.first, MessageBody: 'hello' },
      {
        QueueUrl: queueUrls.second,
        MessageBody: '{"documentId":"test-document","text":"日本語"}',
      },
    ]);
    expect(send.mock.calls[0][1]).toMatchObject({
      abortSignal: expect.any(AbortSignal),
    });
    const client = module!.get<SQSClient>(SQS_CLIENT);
    expect(await client.config.region()).toBe('ap-southeast-1');
    expect(await client.config.maxAttempts()).toBe(3);
  });

  it('supports Standard queue delay without group or dedup options', async () => {
    const send = vi
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(async () => ({ MessageId: 'id' }));
    const sender = await createSender();
    await sender.sendMessage('first', 'event', {
      delaySeconds: 900,
    });
    expect((send.mock.calls[0][0] as SendMessageCommand).input).toMatchObject({
      DelaySeconds: 900,
    });
  });

  it.each(['missing', 'toString', '__proto__', queueUrls.first])(
    'rejects unconfigured aliases without contacting AWS (%s)',
    async (alias) => {
      const send = vi.spyOn(SQSClient.prototype, 'send');
      const sender = await createSender();
      await expect(sender.sendMessage(alias, 'hello')).rejects.toMatchObject({
        errorCode: ErrorCode.BAD_REQUEST,
      });
      expect(send).not.toHaveBeenCalled();
    },
  );

  it.each(['', '\u0000', '\ud800', '😀'.repeat(262145)])(
    'rejects invalid/oversized message bodies',
    async (body) => {
      const send = vi.spyOn(SQSClient.prototype, 'send');
      const sender = await createSender();
      await expect(sender.sendMessage('first', body)).rejects.toMatchObject({
        errorCode: ErrorCode.BAD_REQUEST,
      });
      expect(send).not.toHaveBeenCalled();
    },
  );

  it('accepts exactly 1 MiB of UTF-8 and valid supplementary characters', async () => {
    const send = vi
      .spyOn(SQSClient.prototype, 'send')
      .mockImplementation(async () => ({ MessageId: 'id' }));
    const sender = await createSender();
    await sender.sendMessage('first', '😀'.repeat(262144));
    expect(send).toHaveBeenCalledOnce();
  });

  it('rejects non-serializable JSON before contacting AWS', async () => {
    const send = vi.spyOn(SQSClient.prototype, 'send');
    const sender = await createSender();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    for (const payload of [circular, 1n, undefined]) {
      await expect(
        sender.sendJsonMessage('first', payload),
      ).rejects.toMatchObject({ errorCode: ErrorCode.BAD_REQUEST });
    }
    expect(send).not.toHaveBeenCalled();
  });

  it('uses DTO validation to reject invalid and unknown options before AWS', async () => {
    const send = vi.spyOn(SQSClient.prototype, 'send');
    const sender = await createSender();
    await expect(
      sender.sendMessage('first', 'hello', { delaySeconds: -1 }),
    ).rejects.toMatchObject({ errorCode: ErrorCode.BAD_REQUEST });
    const unsupported = { delaySeconds: 0, messageDeduplicationId: 'event' };
    await expect(
      sender.sendMessage('first', 'hello', unsupported),
    ).rejects.toMatchObject({ errorCode: ErrorCode.BAD_REQUEST });
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    new Error('private-url-and-message-body'),
    new DOMException('private-timeout-context', 'TimeoutError'),
  ])('hides AWS failure/timeout details', async (error) => {
    vi.spyOn(SQSClient.prototype, 'send').mockRejectedValue(error);
    const sender = await createSender();
    await expect(
      sender.sendMessage('first', 'private-body'),
    ).rejects.toMatchObject({
      message: 'Message queue is unavailable',
      errorCode: ErrorCode.QUEUE_UNAVAILABLE,
    });
  });

  it('rejects a response without a message acknowledgement', async () => {
    vi.spyOn(SQSClient.prototype, 'send').mockImplementation(async () => ({}));
    const sender = await createSender();
    await expect(sender.sendMessage('first', 'hello')).rejects.toMatchObject({
      errorCode: ErrorCode.QUEUE_UNAVAILABLE,
    });
  });

  it('does not create a client or send when disabled', async () => {
    envConfig.queue.enabled = false;
    const send = vi.spyOn(SQSClient.prototype, 'send');
    const sender = await createSender();
    expect(module!.get(SQS_CLIENT)).toBeUndefined();
    await expect(sender.sendMessage('first', 'hello')).rejects.toMatchObject({
      errorCode: ErrorCode.QUEUE_UNAVAILABLE,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    { region: '' },
    { timeoutMs: 0 },
    { timeoutMs: Number.NaN },
    { timeoutMs: 2147483648 },
    { queueUrls: {} },
  ])('rejects invalid enabled configuration (%j)', async (invalid) => {
    Object.assign(envConfig.queue, invalid);
    await expect(createSender()).rejects.toThrow(
      'SQS requires a region, queue aliases and valid timeout',
    );
  });

  it('closes the shared client on shutdown without contacting a queue at startup', async () => {
    const send = vi.spyOn(SQSClient.prototype, 'send');
    const destroy = vi.spyOn(SQSClient.prototype, 'destroy');
    await createSender();
    expect(send).not.toHaveBeenCalled();
    await module!.close();
    module = undefined;
    expect(destroy).toHaveBeenCalledOnce();
  });
});
