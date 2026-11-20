import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from '../../config/env.config.js';
import { JwtSignService } from './jwt-sign.service.js';
import { JwtVerifyService } from './jwt-verify.service.js';
import { TotpGenerateService } from './totp-generate.service.js';
import { TotpVerifyService } from './totp-verify.service.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const { secret, expiresInSeconds, issuer, audience } = envConfig.jwt;
        return {
          secret,
          signOptions: {
            algorithm: 'HS256' as const,
            expiresIn: expiresInSeconds,
            issuer,
            audience,
          },
          verifyOptions: { algorithms: ['HS256' as const], issuer, audience },
        };
      },
    }),
  ],
  providers: [
    JwtSignService,
    JwtVerifyService,
    TotpGenerateService,
    TotpVerifyService,
  ],
  exports: [
    JwtSignService,
    JwtVerifyService,
    TotpGenerateService,
    TotpVerifyService,
  ],
})
export class VerificationsModule {}
