import { Module } from '@nestjs/common';
import { SmtpEmailModule } from './nodemailer/email.module.js';
import { EmailService } from './email.service.js';
import { EmailTemplateService } from './email-template.service.js';

@Module({
  imports: [SmtpEmailModule],
  providers: [EmailTemplateService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
