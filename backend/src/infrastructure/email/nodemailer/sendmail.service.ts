import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { envConfig } from '../../../config/env.config.js';
import { ErrorCode } from '../../../common/errors/error-code.js';
import type {
  EmailSender,
  EmailSendResult,
  RenderedEmail,
} from '../interfaces/email.interface.js';
import { SMTP_TRANSPORT } from './email.tokens.js';
import type { SmtpTransport } from './email.tokens.js';

@Injectable()
export class SendmailService implements EmailSender, OnApplicationShutdown {
  constructor(
    @Inject(SMTP_TRANSPORT)
    private readonly transport: SmtpTransport | undefined,
  ) {}

  async send(message: RenderedEmail): Promise<EmailSendResult> {
    if (!this.transport) throw this.unavailable();
    try {
      const result = await this.transport.sendMail({
        from: envConfig.email.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        disableFileAccess: true,
        disableUrlAccess: true,
        signal: AbortSignal.timeout(envConfig.email.timeoutMs),
      });
      if (
        !result.messageId ||
        result.rejected.length ||
        !result.accepted.some(
          (address) => address.toLowerCase() === message.to.toLowerCase(),
        )
      )
        throw this.unavailable();
      return { messageId: result.messageId };
    } catch {
      throw this.unavailable();
    }
  }

  onApplicationShutdown(): void {
    this.transport?.close();
  }

  private unavailable(): ServiceUnavailableException {
    return new ServiceUnavailableException('Email delivery is unavailable', {
      errorCode: ErrorCode.EMAIL_UNAVAILABLE,
    });
  }
}
