import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import handlebars from 'handlebars';
import type {
  RenderedEmail,
  TemplateEmailRequest,
} from './interfaces/email.interface.js';

@Injectable()
export class EmailTemplateService {
  private readonly engine = handlebars.create();

  async render(input: TemplateEmailRequest): Promise<RenderedEmail> {
    // Whitelist before building a path, including for callers bypassing TypeScript.
    if (
      !['send-code', 'study-reminder', 'verify-email-code'].includes(
        input.template,
      )
    )
      throw new Error('Unknown email template');
    const source = await readFile(
      new URL(`./templates/${input.template}.hbs`, import.meta.url),
      'utf8',
    );
    const html = this.engine.compile(source, { strict: true })({
      ...input,
      brandName: 'Đâu Nè!',
    });
    const subject =
      input.template === 'study-reminder'
        ? 'Đến giờ học tiếng Nhật rồi!'
        : input.template === 'verify-email-code'
          ? 'Xác minh email của bạn'
          : 'Mã xác nhận của bạn';
    const text =
      input.template === 'study-reminder'
        ? `Chào ${input.name}, tiếp tục bài học ${input.lessonTitle} tại ${input.studyUrl}. Đâu Nè!`
        : `${subject}: ${input.code}. Mã có hiệu lực trong ${input.expiresInMinutes} phút. Không chia sẻ mã này. Đâu Nè!`;
    return { to: input.to, subject, html, text };
  }
}
