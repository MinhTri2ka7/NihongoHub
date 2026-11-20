import { UnauthorizedException } from '@nestjs/common';
import { JwtPayloadDto } from '../../../../../src/common/verifications/dto/jwt-payload.dto.js';
import { envConfig } from '../../../../../src/config/env.config.js';
import { ErrorCode } from '../../../../../src/common/errors/error-code.js';

const now = Math.floor(Date.now() / 1000);
const payload = {
  sub: 'user-123',
  iat: now - 1,
  exp: now + 900,
  iss: envConfig.jwt.issuer,
  aud: envConfig.jwt.audience,
};

describe('JwtPayloadDto', () => {
  it('returns only validated claims', () => {
    const dto = JwtPayloadDto.fromVerifiedPayload({
      ...payload,
      privateField: 'private-value',
    });
    expect(dto).toBeInstanceOf(JwtPayloadDto);
    expect(dto).toEqual(payload);
    expect('privateField' in dto).toBe(false);
  });

  it.each([
    { sub: '' },
    { sub: '   ' },
    { sub: 123 },
    { iat: undefined },
    { iat: -1 },
    { iat: now + 3600 },
    { iat: now - 0.5 },
    { iat: Number.MAX_SAFE_INTEGER + 1 },
    { exp: undefined },
    { exp: now - 1 },
    { exp: now + 900.5 },
    { exp: Number.MAX_SAFE_INTEGER + 1 },
    { iss: 'other-issuer' },
    { aud: 'other-audience' },
    { aud: [envConfig.jwt.audience] },
  ])('rejects invalid signed claims as INVALID_TOKEN', (overrides) => {
    expect(() =>
      JwtPayloadDto.fromVerifiedPayload({ ...payload, ...overrides }),
    ).toThrow(UnauthorizedException);
  });

  it.each([null, undefined, [], 'private-raw-payload', 123])(
    'rejects malformed payload shapes without exposing them',
    (value) => {
      try {
        JwtPayloadDto.fromVerifiedPayload(value);
        expect.unreachable('Invalid payload must fail');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).errorCode).toBe(
          ErrorCode.INVALID_TOKEN,
        );
        expect((error as UnauthorizedException).message).toBe('Invalid token');
        expect((error as UnauthorizedException).cause).toBeUndefined();
      }
    },
  );
});
