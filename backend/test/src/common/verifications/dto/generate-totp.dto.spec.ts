import { ScureBase32Plugin } from 'otplib';
import { GenerateTotpDto } from '../../../../../src/common/verifications/dto/generate-totp.dto.js';

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

describe('GenerateTotpDto', () => {
  it('normalizes casing and surrounding whitespace', () => {
    expect(GenerateTotpDto.fromSecret(` ${secret.toLowerCase()} `).secret).toBe(
      secret,
    );
  });

  it.each([16, 64])('accepts a valid %i-byte secret', (length) => {
    const encoded = new ScureBase32Plugin().encode(new Uint8Array(length));
    expect(GenerateTotpDto.fromSecret(encoded).secret).toBe(encoded);
  });

  it.each([
    undefined,
    null,
    123,
    {},
    '',
    '   ',
    'private-invalid-secret',
    'JBSWY3DPEHPK3PXP',
    'A'.repeat(105),
  ])('rejects invalid or out-of-range secrets', (value) => {
    expect(() => GenerateTotpDto.fromSecret(value)).toThrow(TypeError);
  });
});
