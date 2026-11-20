import { TotpGenerateService } from '../../../../src/common/verifications/totp-generate.service.js';

// RFC 6238 Appendix B's public SHA-1 test key, encoded as Base32.
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const service = new TotpGenerateService();

describe('TotpGenerateService', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
    [20000000000, '353130'],
  ])(
    'matches the RFC 6238 SHA-1 vector at epoch %i using six digits',
    async (epoch, expected) => {
      vi.spyOn(Date, 'now').mockReturnValue(Number(epoch) * 1000);
      expect(await service.generateCode(secret)).toBe(expected);
    },
  );

  it('keeps a code within its cycle and changes at the exact 30-second boundary', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(0);
    const first = await service.generateCode(secret);
    clock.mockReturnValue(29999);
    expect(await service.generateCode(secret)).toBe(first);
    clock.mockReturnValue(30000);
    expect(await service.generateCode(secret)).toBe('287082');
    expect(await service.generateCode(secret)).not.toBe(first);
  });

  it('rejects invalid secrets without including the input', () => {
    expect(() => service.generateCode('private-invalid-secret')).toThrow(
      new TypeError(
        'TOTP secret must be valid Base32 encoding of 16 to 64 bytes',
      ),
    );
  });
});
