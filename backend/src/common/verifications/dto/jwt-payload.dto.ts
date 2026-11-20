import { UnauthorizedException } from '@nestjs/common';
import { Expose, plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsString,
  Max,
  Min,
  ValidateBy,
  validateSync,
} from 'class-validator';
import { envConfig } from '../../../config/env.config.js';
import { ErrorCode } from '../../errors/error-code.js';
import { SignJwtDto } from './sign-jwt.dto.js';

export class JwtPayloadDto extends SignJwtDto {
  @Expose()
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  @ValidateBy({
    name: 'issuedInPast',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'number' && value <= Math.floor(Date.now() / 1000),
    },
  })
  iat: number;

  @Expose()
  @IsInt()
  @Min(0)
  @Max(Number.MAX_SAFE_INTEGER)
  @ValidateBy({
    name: 'expiresAfterIssue',
    validator: {
      validate: (value: unknown, args) => {
        const payload = args?.object as JwtPayloadDto | undefined;
        return (
          typeof value === 'number' &&
          typeof payload?.iat === 'number' &&
          value > payload.iat
        );
      },
    },
  })
  exp: number;

  @Expose()
  @IsString()
  @ValidateBy({
    name: 'expectedIssuer',
    validator: { validate: (value: unknown) => value === envConfig.jwt.issuer },
  })
  iss: string;

  @Expose()
  @IsString()
  @ValidateBy({
    name: 'expectedAudience',
    validator: {
      validate: (value: unknown) => value === envConfig.jwt.audience,
    },
  })
  aud: string;

  static fromVerifiedPayload(payload: unknown): JwtPayloadDto {
    const dto = plainToInstance(JwtPayloadDto, payload, {
      excludeExtraneousValues: true,
    });
    if (
      !(dto instanceof JwtPayloadDto) ||
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
