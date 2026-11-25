import type Mail from 'nodemailer/lib/mailer';
import type { SMTPSentMessageInfo } from 'nodemailer/lib/smtp-transport';

export const SMTP_TRANSPORT = Symbol('SMTP_TRANSPORT');
export type SmtpTransport = Pick<
  Mail<SMTPSentMessageInfo>,
  'sendMail' | 'close'
>;
