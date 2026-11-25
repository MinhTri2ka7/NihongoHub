export type EmailTemplateName =
  'send-code' | 'study-reminder' | 'verify-email-code';

export interface CodeEmailInput {
  to: string;
  code: string;
  expiresInMinutes: number;
}

export interface StudyReminderEmailInput {
  to: string;
  name: string;
  lessonTitle: string;
  studyUrl: string;
}

export type TemplateEmailRequest =
  | (CodeEmailInput & { template: 'send-code' | 'verify-email-code' })
  | (StudyReminderEmailInput & { template: 'study-reminder' });

export interface RenderedEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  messageId: string;
}
export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
export interface EmailSender {
  send(message: RenderedEmail): Promise<EmailSendResult>;
}
