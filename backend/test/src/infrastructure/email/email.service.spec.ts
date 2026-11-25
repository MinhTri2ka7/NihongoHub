import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EmailService } from '../../../../src/infrastructure/email/email.service.js';
import { EmailTemplateService } from '../../../../src/infrastructure/email/email-template.service.js';
import type {
  EmailSender,
  TemplateEmailRequest,
} from '../../../../src/infrastructure/email/interfaces/email.interface.js';

describe('template email service', () => {
  const send = vi.fn<EmailSender['send']>();
  const templates = new EmailTemplateService();
  let service: EmailService;

  beforeEach(() => {
    send.mockReset().mockResolvedValue({ messageId: 'test-message' });
    service = new EmailService({ send }, templates);
  });

  it('renders all three allowlisted templates with HTML and plaintext', async () => {
    await service.sendCode({
      to: 'learner@example.com',
      code: '012345',
      expiresInMinutes: 5,
    });
    await service.sendVerifyEmailCode({
      to: 'learner@example.com',
      code: '001234',
      expiresInMinutes: 10,
    });
    await service.sendStudyReminder({
      to: 'learner@example.com',
      name: 'An',
      lessonTitle: '日本語の勉強',
      studyUrl: 'https://example.com/learn',
    });
    expect(send).toHaveBeenCalledTimes(3);
    const messages = send.mock.calls.map(([message]) => message);
    expect(messages[0].html).toContain('012345');
    expect(messages[0].text).toContain('012345');
    expect(messages[1].html).toContain('Xác minh email');
    expect(messages[1].text).toContain('001234');
    expect(messages[2].html).toContain('日本語の勉強');
    expect(messages[2].text).toContain('https://example.com/learn');
    for (const message of messages) {
      expect(message.html).toMatch(/<!doctype html>/i);
      expect(message.text.length).toBeGreaterThan(20);
      expect(message.html).not.toContain('{{');
    }
  });

  it('escapes user-controlled content and URL attributes', async () => {
    await service.sendStudyReminder({
      to: 'learner@example.com',
      name: '<img src=x onerror=alert(1)>',
      lessonTitle: '<script>bad</script>',
      studyUrl: 'https://example.com/learn?one=1&two=2',
    });
    const message = send.mock.calls[0][0];
    expect(message.html).not.toContain('<script>');
    expect(message.html).not.toContain('<img');
    expect(message.html).toContain('&lt;script&gt;');
    expect(message.html).toContain('&amp;two');
  });

  it.each([
    { to: 'not-an-email', code: '012345', expiresInMinutes: 5 },
    {
      to: 'one@example.com,two@example.com',
      code: '012345',
      expiresInMinutes: 5,
    },
    {
      to: 'one@example.com\r\nBcc: two@example.com',
      code: '012345',
      expiresInMinutes: 5,
    },
    { to: 'one@example.com', code: '12345', expiresInMinutes: 5 },
    { to: 'one@example.com', code: '012345', expiresInMinutes: 0 },
    { to: 'one@example.com', code: '012345', expiresInMinutes: 1.5 },
    { to: 'one@example.com', code: '012345', expiresInMinutes: 61 },
    {
      to: 'one@example.com',
      code: '012345',
      expiresInMinutes: 5,
      extra: 'unexpected',
    },
  ])('rejects invalid code payload before SMTP', async (input) => {
    await expect(service.sendCode(input)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it.each([
    'javascript:alert(1)',
    'http://example.com',
    'https://user:password@example.com',
    'not-a-url',
  ])('rejects unsafe study links', async (studyUrl) => {
    await expect(
      service.sendStudyReminder({
        to: 'one@example.com',
        name: 'An',
        lessonTitle: 'Lesson',
        studyUrl,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(send).not.toHaveBeenCalled();
  });

  it('does not expose renderer paths or raw exceptions', async () => {
    const render = vi
      .spyOn(templates, 'render')
      .mockRejectedValueOnce(new Error('private-file-path'));
    const result = service.sendCode({
      to: 'one@example.com',
      code: '012345',
      expiresInMinutes: 5,
    });
    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(result).rejects.not.toThrow('private-file-path');
    expect(send).not.toHaveBeenCalled();
    render.mockRestore();
  });

  it('rejects template traversal before accessing a file', async () => {
    await expect(
      templates.render({
        template: '../../../config',
        to: 'one@example.com',
      } as unknown as TemplateEmailRequest),
    ).rejects.toThrow('Unknown email template');
  });
});
