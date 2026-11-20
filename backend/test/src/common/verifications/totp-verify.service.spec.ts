import { TotpGenerateService } from '../../../../src/common/verifications/totp-generate.service.js';
import { TotpVerifyService } from '../../../../src/common/verifications/totp-verify.service.js';

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const generator = new TotpGenerateService();
const verifier = new TotpVerifyService();
const epoch = 1234567890;

describe('TotpVerifyService', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([-30, 0, 30])(
    'accepts a code at clock offset %i seconds',
    async (offset) => {
      const clock = vi
        .spyOn(Date, 'now')
        .mockReturnValue((epoch + offset) * 1000);
      const otp = await generator.generateCode(secret);
      clock.mockReturnValue(epoch * 1000);
      expect(await verifier.verifyCode(otp, secret)).toBe(true);
    },
  );

  it.each([-60, 60])(
    'rejects a code outside the allowed window (%i seconds)',
    async (offset) => {
      const clock = vi
        .spyOn(Date, 'now')
        .mockReturnValue((epoch + offset) * 1000);
      const otp = await generator.generateCode(secret);
      clock.mockReturnValue(epoch * 1000);
      expect(await verifier.verifyCode(otp, secret)).toBe(false);
    },
  );

  it('rejects incorrect codes and a different secret', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(epoch * 1000);
    const otp = await generator.generateCode(secret);
    expect(await verifier.verifyCode('999999', secret)).toBe(false);
    expect(
      await verifier.verifyCode(otp, 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'),
    ).toBe(false);
  });

  it('preserves and verifies leading zeros', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1111111109 * 1000);
    expect(await verifier.verifyCode('081804', secret)).toBe(true);
    expect(await verifier.verifyCode('81804', secret)).toBe(false);
  });

  it('returns false for invalid input instead of leaking validation details', async () => {
    expect(await verifier.verifyCode('123456', 'private-invalid-secret')).toBe(
      false,
    );
    expect(await verifier.verifyCode('not-an-otp', secret)).toBe(false);
  });

  it('does not log the secret or OTP', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    vi.spyOn(Date, 'now').mockReturnValue(epoch * 1000);
    await verifier.verifyCode(await generator.generateCode(secret), secret);
    expect(log).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });
});
