import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { envConfig } from '../../../../src/config/env.config.js';
import { JwtSignService } from '../../../../src/common/verifications/jwt-sign.service.js';
import { VerificationsModule } from '../../../../src/common/verifications/verifications.module.js';

describe('JwtSignService', () => {
  let module: TestingModule;
  let service: JwtSignService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [VerificationsModule],
    }).compile();
    service = module.get(JwtSignService);
  });
  afterAll(async () => {
    await module.close();
  });

  it('signs only the subject with configured algorithm, issuer, audience and expiry', async () => {
    const settings = envConfig.jwt;
    const token = await service.signToken({
      sub: 'user-123',
      privateField: 'never-in-token',
    } as { sub: string });
    const payload = new JwtService().verify(token, {
      secret: settings.secret,
      algorithms: ['HS256'],
      issuer: settings.issuer,
      audience: settings.audience,
    });
    expect(payload).toEqual({
      sub: 'user-123',
      iat: expect.any(Number),
      exp: expect.any(Number),
      iss: settings.issuer,
      aud: settings.audience,
    });
    expect(payload.exp - payload.iat).toBe(900);
  });

  it.each(['', '   '])('rejects an empty subject', (sub) => {
    expect(() => service.signToken({ sub })).toThrow(TypeError);
  });
});
