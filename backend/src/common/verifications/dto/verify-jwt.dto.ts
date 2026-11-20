import { UnauthorizedException } from '@nestjs/common';
import { IsString, Matches, validateSync } from 'class-validator';
import { ErrorCode } from '../../errors/error-code.js';

export class VerifyJwtDto {
  @IsString()
  @Matches(/\S/)
  token: string;

  static fromToken(token: unknown): VerifyJwtDto {
    const dto = Object.assign(new VerifyJwtDto(), { token });
    if (
      validateSync(dto, { validationError: { target: false, value: false } })
        .length
    ) {
      throw new UnauthorizedException('Invalid token', {
        errorCode: ErrorCode.INVALID_TOKEN,
      });
    }
    return dto;
  }
}
