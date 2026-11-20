import { Test } from '@nestjs/testing';
import { TotpGenerateService } from '../../../../src/common/verifications/totp-generate.service.js';
import { TotpVerifyService } from '../../../../src/common/verifications/totp-verify.service.js';
import { VerificationsModule } from '../../../../src/common/verifications/verifications.module.js';

describe('VerificationsModule', () => {
  it('exports both TOTP services', async () => {
    const module = await Test.createTestingModule({
      imports: [VerificationsModule],
    }).compile();
    try {
      expect(module.get(TotpGenerateService)).toBeInstanceOf(
        TotpGenerateService,
      );
      expect(module.get(TotpVerifyService)).toBeInstanceOf(TotpVerifyService);
    } finally {
      await module.close();
    }
  });
});
