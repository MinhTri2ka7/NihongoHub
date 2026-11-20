import { VerifyTotpDto } from '../../../../../src/common/verifications/dto/verify-totp.dto.js';

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('VerifyTotpDto', () => {
  it('retains all six digits including leading zeros', () => {
    expect(VerifyTotpDto.fromCode('005924', secret)).toEqual({
      otp: '005924',
      secret,
    });
  });

  it.each([
    undefined,
    null,
    123456,
    {},
    '',
    '12345',
    '1234567',
    'abcdef',
    ' 123456',
    '１２３４５６',
  ])('rejects malformed OTP values', (otp) => {
    expect(VerifyTotpDto.fromCode(otp, secret)).toBeUndefined();
  });

  it('also validates the secret', () => {
    expect(VerifyTotpDto.fromCode('123456', 'invalid-secret')).toBeUndefined();
  });
});
