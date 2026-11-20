import { Injectable } from '@nestjs/common';
import { verify } from 'otplib';
import { VerifyTotpDto } from './dto/verify-totp.dto.js';

@Injectable()
export class TotpVerifyService {
  async verifyCode(otp: string, secret: string): Promise<boolean> {
    const dto = VerifyTotpDto.fromCode(otp, secret);
    if (!dto) return false;
    const result = await verify({
      token: dto.otp,
      secret: dto.secret,
      strategy: 'totp',
      algorithm: 'sha1',
      digits: 6,
      period: 30,
      epochTolerance: 30,
    });
    return result.valid;
  }
}
