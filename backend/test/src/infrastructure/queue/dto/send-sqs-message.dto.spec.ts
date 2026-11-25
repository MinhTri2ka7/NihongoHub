import { ErrorCode } from '../../../../../src/common/errors/error-code.js';
import { SendSqsMessageDto } from '../../../../../src/infrastructure/queue/dto/send-sqs-message.dto.js';
import { SqsMessageOptionsDto } from '../../../../../src/infrastructure/queue/dto/sqs-message-options.dto.js';

describe('SendSqsMessageDto', () => {
  it('creates typed message/options instances and preserves text', () => {
    const dto = SendSqsMessageDto.fromInput('queue_1', '日本語\nmessage', {
      delaySeconds: 0,
    });
    expect(dto).toBeInstanceOf(SendSqsMessageDto);
    expect(dto.options).toBeInstanceOf(SqsMessageOptionsDto);
    expect(dto.messageBody).toBe('日本語\nmessage');
    expect(dto.options.delaySeconds).toBe(0);
    expect(
      SendSqsMessageDto.fromInput('queue', 'hello').options.delaySeconds,
    ).toBeUndefined();
    expect(
      SendSqsMessageDto.fromInput('queue', 'hello', { delaySeconds: 900 })
        .options.delaySeconds,
    ).toBe(900);
  });

  it.each(['', ' ', 'bad alias', '__proto__', 'a'.repeat(65), null, 12])(
    'rejects invalid aliases',
    (alias) => {
      expect(() => SendSqsMessageDto.fromInput(alias, 'hello')).toThrow();
    },
  );

  it.each(['', '\u0000', '\ud800', '\ufffe', '😀'.repeat(262145), null, 42])(
    'rejects invalid message bodies without exposing input',
    (body) => {
      try {
        SendSqsMessageDto.fromInput('queue', body);
      } catch (error) {
        expect(error).toMatchObject({
          message: 'Invalid queue message or options',
          errorCode: ErrorCode.BAD_REQUEST,
        });
        return;
      }
      expect.fail('Expected invalid message to be rejected');
    },
  );

  it('accepts UTF-8 size boundary and the SQS whitespace characters', () => {
    expect(
      SendSqsMessageDto.fromInput('queue', '😀'.repeat(262144)).messageBody,
    ).toHaveLength(524288);
    expect(SendSqsMessageDto.fromInput('queue', '\t\r\n').messageBody).toBe(
      '\t\r\n',
    );
  });

  it.each([
    null,
    [],
    'invalid',
    12,
    { delaySeconds: null },
    { delaySeconds: '5' },
    { delaySeconds: -1 },
    { delaySeconds: 901 },
    { delaySeconds: 1.5 },
    { delaySeconds: Number.NaN },
    { messageGroupId: 'group' },
    { messageDeduplicationId: 'event' },
    { delaySeconds: 0, unexpected: true },
  ])('rejects invalid and unsupported Standard options', (options) => {
    expect(() =>
      SendSqsMessageDto.fromInput('queue', 'hello', options),
    ).toThrow('Invalid queue message or options');
  });

  it('serializes JSON through the same validated message DTO', () => {
    expect(
      SendSqsMessageDto.fromJson(
        'queue',
        { eventId: 'event', title: '日本語' },
        { delaySeconds: 2 },
      ),
    ).toMatchObject({
      queueName: 'queue',
      messageBody: '{"eventId":"event","title":"日本語"}',
      options: { delaySeconds: 2 },
    });
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    for (const payload of [circular, 1n, undefined, () => undefined]) {
      expect(() => SendSqsMessageDto.fromJson('queue', payload)).toThrow();
    }
  });
});
