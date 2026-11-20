import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  JsonWebTokenError,
  JwtService,
  NotBeforeError,
  TokenExpiredError,
} from '@nestjs/jwt';
import { ErrorCode } from '../errors/error-code.js';
import { VerifyJwtDto } from './dto/verify-jwt.dto.js';
import { JwtPayloadDto } from './dto/jwt-payload.dto.js';

@Injectable()
export class JwtVerifyService {
  constructor(private readonly jwt: JwtService) {}

  async verifyToken(token: string): Promise<JwtPayloadDto> {
    const dto = VerifyJwtDto.fromToken(token);
    let payload: unknown;
    try {
      payload = await this.jwt.verifyAsync<Record<string, unknown>>(dto.token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Token expired', {
          errorCode: ErrorCode.TOKEN_EXPIRED,
        });
      }
      if (
        error instanceof JsonWebTokenError ||
        error instanceof NotBeforeError
      ) {
        throw new UnauthorizedException('Invalid token', {
          errorCode: ErrorCode.INVALID_TOKEN,
        });
      }
      throw error;
    }

    return JwtPayloadDto.fromVerifiedPayload(payload);
  }
}
