import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { envConfig } from '../../config/env.config.js';
import { ErrorCode } from '../../common/errors/error-code.js';
import { SQS_CLIENT } from './sqs.tokens.js';
import type { SqsSendResult } from './sqs.types.js';
import { SendSqsMessageDto } from './dto/send-sqs-message.dto.js';
import { SqsMessageOptionsDto } from './dto/sqs-message-options.dto.js';

@Injectable()
export class SqsMessageService implements OnApplicationShutdown {
  private readonly settings = envConfig.queue;

  constructor(
    @Inject(SQS_CLIENT) private readonly client: SQSClient | undefined,
  ) {}

  async sendJsonMessage(
    queueName: string,
    payload: unknown,
    options: SqsMessageOptionsDto = {},
  ): Promise<SqsSendResult> {
    return this.send(SendSqsMessageDto.fromJson(queueName, payload, options));
  }

  async sendMessage(
    queueName: string,
    messageBody: string,
    options: SqsMessageOptionsDto = {},
  ): Promise<SqsSendResult> {
    return this.send(
      SendSqsMessageDto.fromInput(queueName, messageBody, options),
    );
  }

  private async send(dto: SendSqsMessageDto): Promise<SqsSendResult> {
    if (!this.client) throw this.unavailable();
    if (!Object.hasOwn(this.settings.queueUrls, dto.queueName)) {
      throw new BadRequestException('Unknown queue alias', {
        errorCode: ErrorCode.BAD_REQUEST,
      });
    }
    const command = new SendMessageCommand({
      QueueUrl: this.settings.queueUrls[dto.queueName],
      MessageBody: dto.messageBody,
      ...(dto.options.delaySeconds !== undefined
        ? { DelaySeconds: dto.options.delaySeconds }
        : {}),
    });
    try {
      const result = await this.client.send(command, {
        abortSignal: AbortSignal.timeout(this.settings.timeoutMs),
      });
      if (!result.MessageId) throw this.unavailable();
      return { messageId: result.MessageId };
    } catch {
      throw this.unavailable();
    }
  }

  onApplicationShutdown(): void {
    this.client?.destroy();
  }
  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException('Message queue is unavailable', {
      errorCode: ErrorCode.QUEUE_UNAVAILABLE,
    });
  }
}
