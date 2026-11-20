import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { envConfig } from '../../../../src/config/env.config.js';
import { ErrorCode } from '../../../../src/common/errors/error-code.js';
import { JwtSignService } from '../../../../src/common/verifications/jwt-sign.service.js';
import { JwtVerifyService } from '../../../../src/common/verifications/jwt-verify.service.js';
import { VerificationsModule } from '../../../../src/common/verifications/verifications.module.js';

describe('JwtVerifyService', () => {
  let module: TestingModule;
  let service: JwtVerifyService;
  let rawJwt: JwtService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [VerificationsModule],
    }).compile();
    service = module.get(JwtVerifyService);
    const { secret, issuer, audience } = envConfig.jwt;
    rawJwt = new JwtService({
      secret,
      signOptions: { issuer, audience, algorithm: 'HS256' },
    });
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    await module.close();
  });

  async function expectUnauthorized(
    token: string,
    code = ErrorCode.INVALID_TOKEN,
  ) {
    try {
      await service.verifyToken(token);
      expect.unreachable('Verification must fail');
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).getStatus()).toBe(401);
      expect((error as UnauthorizedException).errorCode).toBe(code);
      expect((error as UnauthorizedException).cause).toBeUndefined();
    }
  }

  it('verifies a token issued by JwtSignService', async () => {
    const token = await module
      .get(JwtSignService)
      .signToken({ sub: 'user-123' });
    expect(await service.verifyToken(token)).toMatchObject({
      sub: 'user-123',
      iat: expect.any(Number),
      exp: expect.any(Number),
    });
  });

  it.each(['', '   ', 'malformed-token'])(
    'rejects missing or malformed tokens',
    async (token) => {
      await expectUnauthorized(token);
    },
  );

  it.each([
    {
      label: 'wrong secret',
      options: { secret: 'a-different-test-secret-of-at-least-32-bytes' },
    },
    { label: 'wrong issuer', options: { issuer: 'other-issuer' } },
    { label: 'wrong audience', options: { audience: 'other-audience' } },
    { label: 'wrong algorithm', options: { algorithm: 'HS384' } },
  ])('rejects $label', async ({ options }) => {
    const token = await rawJwt.signAsync({ sub: 'user-123' }, {
      expiresIn: 900,
      ...options,
    } as JwtSignOptions);
    await expectUnauthorized(token);
  });

  it('rejects modified signatures', async () => {
    const token = await rawJwt.signAsync(
      { sub: 'user-123' },
      { expiresIn: 900 },
    );
    const parts = token.split('.');
    parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1);
    await expectUnauthorized(parts.join('.'));
  });

  it('identifies expired tokens', async () => {
    const token = await rawJwt.signAsync(
      { sub: 'user-123', iat: Math.floor(Date.now() / 1000) - 60 },
      { expiresIn: 30 },
    );
    await expectUnauthorized(token, ErrorCode.TOKEN_EXPIRED);
  });

  it('rejects tokens that are not active yet', async () => {
    const token = await rawJwt.signAsync(
      { sub: 'user-123' },
      { expiresIn: 900, notBefore: 60 },
    );
    await expectUnauthorized(token);
  });

  it.each([{ sub: '' }, { sub: 123 }, { other: 'value' }])(
    'rejects invalid subjects in signed payloads',
    async (payload) => {
      await expectUnauthorized(
        await rawJwt.signAsync(payload, { expiresIn: 900 }),
      );
    },
  );

  it('requires expiration even on correctly signed tokens', async () => {
    await expectUnauthorized(await rawJwt.signAsync({ sub: 'user-123' }));
  });

  it('requires an issued-at timestamp', async () => {
    await expectUnauthorized(
      await rawJwt.signAsync(
        { sub: 'user-123' },
        { expiresIn: 900, noTimestamp: true },
      ),
    );
  });

  it('does not turn unexpected service errors into authentication failures', async () => {
    const error = new Error('Unexpected internal failure');
    vi.spyOn(module.get(JwtService), 'verifyAsync').mockRejectedValue(error);
    await expect(service.verifyToken('placeholder')).rejects.toBe(error);
  });
});
