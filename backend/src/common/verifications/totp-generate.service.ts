import { Injectable } from '@nestjs/common';
import { generate } from 'otplib';
import { GenerateTotpDto } from './dto/generate-totp.dto.js';

@Injectable()
export class TotpGenerateService {
  generateCode(secret: string): Promise<string> {
    const dto = GenerateTotpDto.fromSecret(secret);
    return generate({
      secret: dto.secret,
      strategy: 'totp',
      algorithm: 'sha1',
      digits: 6,
      period: 30,
    });
  }
}
