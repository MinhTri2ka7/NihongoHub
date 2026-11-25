import { Module } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { envConfig } from '../../../config/env.config.js';
import { EMAIL_SENDER } from '../interfaces/email.interface.js';
import { SendmailService } from './sendmail.service.js';
import { SMTP_TRANSPORT } from './email.tokens.js';
import type { SmtpTransport } from './email.tokens.js';

@Module({
  providers: [
    {
      provide: SMTP_TRANSPORT,
      useFactory: (): SmtpTransport | undefined => {
        const settings = envConfig.email;
        if (!settings.enabled) return undefined;
        return nodemailer.createTransport({
          host: settings.host,
          port: settings.port,
          secure: settings.secure,
          requireTLS: !settings.secure,
          auth: { user: settings.user, pass: settings.pass },
          connectionTimeout: settings.timeoutMs,
          greetingTimeout: settings.timeoutMs,
          socketTimeout: settings.timeoutMs,
          tls: { minVersion: 'TLSv1.2' },
          logger: false,
          debug: false,
          disableFileAccess: true,
          disableUrlAccess: true,
        });
      },
    },
    SendmailService,
    { provide: EMAIL_SENDER, useExisting: SendmailService },
  ],
  exports: [EMAIL_SENDER],
})
export class SmtpEmailModule {}
