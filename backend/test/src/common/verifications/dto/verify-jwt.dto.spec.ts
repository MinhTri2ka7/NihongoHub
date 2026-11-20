import { UnauthorizedException } from '@nestjs/common';
import { VerifyJwtDto } from '../../../../../src/common/verifications/dto/verify-jwt.dto.js';
import { ErrorCode } from '../../../../../src/common/errors/error-code.js';

describe('VerifyJwtDto', () => {
  it('preserves the token for cryptographic verification in the service', () => {
    expect(VerifyJwtDto.fromToken('signed-token').token).toBe('signed-token');
  });

  it.each([undefined, null, 123, {}, [], '', '   '])(
    'rejects invalid token inputs as 401 without exposing them',
    (token) => {
      try {
        VerifyJwtDto.fromToken(token);
        expect.unreachable('Invalid token input must fail');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect((error as UnauthorizedException).getStatus()).toBe(401);
        expect((error as UnauthorizedException).errorCode).toBe(
          ErrorCode.INVALID_TOKEN,
        );
        expect((error as UnauthorizedException).message).toBe('Invalid token');
        expect((error as UnauthorizedException).cause).toBeUndefined();
      }
    },
  );
});
