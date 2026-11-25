import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ErrorCode } from '../../common/errors/error-code.js';
import { SendTemplateEmailDto } from './dto/send-template-email.dto.js';
import { EmailTemplateService } from './email-template.service.js';
import { EMAIL_SENDER } from './interfaces/email.interface.js';
import type {
  CodeEmailInput,
  EmailSender,
  EmailSendResult,
  StudyReminderEmailInput,
} from './interfaces/email.interface.js';

@Injectable()
export class EmailService {
  constructor(
    @Inject(EMAIL_SENDER) private readonly sender: EmailSender,
    @Inject(EmailTemplateService)
    private readonly templates: EmailTemplateService,
  ) {}

  sendCode(input: CodeEmailInput): Promise<EmailSendResult> {
    return this.send({ ...input, template: 'send-code' });
  }

  sendVerifyEmailCode(input: CodeEmailInput): Promise<EmailSendResult> {
    return this.send({ ...input, template: 'verify-email-code' });
  }

  sendStudyReminder(input: StudyReminderEmailInput): Promise<EmailSendResult> {
    return this.send({ ...input, template: 'study-reminder' });
  }

  private async send(input: unknown): Promise<EmailSendResult> {
    const dto = SendTemplateEmailDto.fromInput(input);
    let message;
    try {
      message = await this.templates.render(dto);
    } catch {
      throw new ServiceUnavailableException('Email templates are unavailable', {
        errorCode: ErrorCode.EMAIL_UNAVAILABLE,
      });
    }
    return this.sender.send(message);
  }
}
