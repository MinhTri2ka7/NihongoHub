import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer/lib/mailer';
import { envConfig } from '../../../../../src/config/env.config.js';
import { ErrorCode } from '../../../../../src/common/errors/error-code.js';
import { EmailModule } from '../../../../../src/infrastructure/email/email.module.js';
import { EmailService } from '../../../../../src/infrastructure/email/email.service.js';
import { SendmailService } from '../../../../../src/infrastructure/email/nodemailer/sendmail.service.js';

describe('Nodemailer email infrastructure', () => {
  const original = envConfig.email;
  const close = vi.fn();
  const sendMail = vi.fn<(message: SendMailOptions) => Promise<unknown>>();
  let module: TestingModule | undefined;

  beforeEach(() => {
    close.mockReset();
    sendMail.mockReset().mockResolvedValue({
      messageId: 'test-message',
      accepted: ['learner@example.com'],
      rejected: [],
    });
    envConfig.email = {
      enabled: true,
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'test-user',
      pass: 'test-only-password',
      from: 'Test Team <sender@example.com>',
      timeoutMs: 1000,
    };
    vi.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail,
      close,
    } as unknown as ReturnType<typeof nodemailer.createTransport>);
  });

  afterEach(async () => {
    await module?.close();
    module = undefined;
    envConfig.email = original;
    vi.restoreAllMocks();
  });

  async function createModule() {
    module = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();
    await module.init();
    return module.get(EmailService);
  }

  it('wires Nest DI, configures TLS, renders HBS and sends only on demand', async () => {
    const email = await createModule();
    expect(sendMail).not.toHaveBeenCalled();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        secure: true,
        port: 465,
        logger: false,
        debug: false,
        connectionTimeout: 1000,
        greetingTimeout: 1000,
        socketTimeout: 1000,
        tls: { minVersion: 'TLSv1.2' },
      }),
    );
    await expect(
      email.sendVerifyEmailCode({
        to: 'learner@example.com',
        code: '012345',
        expiresInMinutes: 5,
      }),
    ).resolves.toEqual({ messageId: 'test-message' });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Test Team <sender@example.com>',
        to: 'learner@example.com',
        disableFileAccess: true,
        disableUrlAccess: true,
        signal: expect.any(AbortSignal),
      }),
    );
    expect(sendMail.mock.calls[0][0].html).toContain('012345');
    await module?.close();
    module = undefined;
    expect(close).toHaveBeenCalledOnce();
  });

  it('does not create a transport when disabled and does not pretend to send', async () => {
    envConfig.email = { ...envConfig.email, enabled: false };
    const email = await createModule();
    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    await expect(
      email.sendCode({
        to: 'learner@example.com',
        code: '012345',
        expiresInMinutes: 5,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('requires STARTTLS when immediate TLS is not configured', async () => {
    envConfig.email = { ...envConfig.email, port: 587, secure: false };
    await createModule();
    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: false, requireTLS: true }),
    );
  });

  it.each([
    { messageId: '', accepted: ['learner@example.com'], rejected: [] },
    {
      messageId: 'test-message',
      accepted: [],
      rejected: ['learner@example.com'],
    },
    {
      messageId: 'test-message',
      accepted: ['someone-else@example.com'],
      rejected: [],
    },
  ])(
    'rejects incomplete acceptance and sanitizes failures',
    async (receipt) => {
      sendMail.mockResolvedValueOnce(receipt);
      const email = await createModule();
      const promise = email.sendCode({
        to: 'learner@example.com',
        code: '012345',
        expiresInMinutes: 5,
      });
      await expect(promise).rejects.toMatchObject({
        options: { errorCode: ErrorCode.EMAIL_UNAVAILABLE },
      });
    },
  );

  it('does not expose SMTP errors containing credentials or message contents', async () => {
    sendMail.mockRejectedValueOnce(new Error('private-password-and-code'));
    const email = await createModule();
    const promise = email.sendCode({
      to: 'learner@example.com',
      code: '012345',
      expiresInMinutes: 5,
    });
    await expect(promise).rejects.toThrow('Email delivery is unavailable');
    await expect(promise).rejects.not.toThrow('private-password-and-code');
  });

  it('sets a real abort deadline for an outstanding SMTP send', async () => {
    envConfig.email = { ...envConfig.email, timeoutMs: 20 };
    sendMail.mockImplementationOnce(
      (message) =>
        new Promise((_resolve, reject) => {
          message.signal?.addEventListener(
            'abort',
            () => reject(new Error('private-timeout')),
            { once: true },
          );
        }),
    );
    const email = await createModule();
    await expect(
      email.sendCode({
        to: 'learner@example.com',
        code: '012345',
        expiresInMinutes: 5,
      }),
    ).rejects.toThrow('Email delivery is unavailable');
  });

  it('supports lifecycle without a transporter', () => {
    expect(() =>
      new SendmailService(undefined).onApplicationShutdown(),
    ).not.toThrow();
  });
});
