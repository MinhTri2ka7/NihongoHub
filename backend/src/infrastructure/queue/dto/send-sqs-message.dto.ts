import { BadRequestException } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsDefined,
  IsObject,
  IsString,
  Matches,
  ValidateBy,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { ErrorCode } from '../../../common/errors/error-code.js';
import { SqsMessageOptionsDto } from './sqs-message-options.dto.js';

function isSqsMessageBody(value: unknown): boolean {
  if (
    typeof value !== 'string' ||
    !value.length ||
    Buffer.byteLength(value, 'utf8') > 1048576
  )
    return false;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    if (
      point !== 9 &&
      point !== 10 &&
      point !== 13 &&
      !(point >= 0x20 && point <= 0xd7ff) &&
      !(point >= 0xe000 && point <= 0xfffd) &&
      !(point >= 0x10000 && point <= 0x10ffff)
    )
      return false;
  }
  return true;
}

export class SendSqsMessageDto {
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)
  queueName: string;

  @IsString()
  @ValidateBy({
    name: 'sqsMessageBody',
    validator: { validate: isSqsMessageBody },
  })
  messageBody: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => SqsMessageOptionsDto)
  options: SqsMessageOptionsDto;

  static fromInput(
    queueName: unknown,
    messageBody: unknown,
    options: unknown = {},
  ): SendSqsMessageDto {
    const dto = plainToInstance(SendSqsMessageDto, {
      queueName,
      messageBody,
      options,
    });
    if (
      validateSync(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
        validationError: { target: false, value: false },
      }).length
    ) {
      throw new BadRequestException('Invalid queue message or options', {
        errorCode: ErrorCode.BAD_REQUEST,
      });
    }
    return dto;
  }

  static fromJson(
    queueName: unknown,
    payload: unknown,
    options: unknown = {},
  ): SendSqsMessageDto {
    let body: string | undefined;
    try {
      body = JSON.stringify(payload);
    } catch {
      throw new BadRequestException('Message must be JSON serializable', {
        errorCode: ErrorCode.BAD_REQUEST,
      });
    }
    return this.fromInput(queueName, body, options);
  }
}
