import { BadRequestException } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { ErrorCode } from '../../../common/errors/error-code.js';
import type { TemplateEmailRequest } from '../interfaces/email.interface.js';

export class SendTemplateEmailDto {
  static fromInput(input: unknown): TemplateEmailRequest {
    const invalid = () =>
      new BadRequestException('Invalid email template data', {
        errorCode: ErrorCode.BAD_REQUEST,
      });
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw invalid();
    const value = input as Record<string, unknown>;
    if (
      typeof value.to !== 'string' ||
      value.to.length > 254 ||
      !isEmail(value.to) ||
      /[\r\n]/.test(value.to)
    )
      throw invalid();
    if (
      value.template === 'send-code' ||
      value.template === 'verify-email-code'
    ) {
      if (
        Object.keys(value).some(
          (key) =>
            !['to', 'template', 'code', 'expiresInMinutes'].includes(key),
        ) ||
        typeof value.code !== 'string' ||
        !/^\d{6}$/.test(value.code) ||
        typeof value.expiresInMinutes !== 'number' ||
        !Number.isInteger(value.expiresInMinutes) ||
        value.expiresInMinutes < 1 ||
        value.expiresInMinutes > 60
      )
        throw invalid();
      return {
        template: value.template,
        to: value.to,
        code: value.code,
        expiresInMinutes: value.expiresInMinutes,
      };
    }
    if (
      value.template !== 'study-reminder' ||
      Object.keys(value).some(
        (key) =>
          !['to', 'template', 'name', 'lessonTitle', 'studyUrl'].includes(key),
      )
    )
      throw invalid();
    if (
      typeof value.name !== 'string' ||
      !value.name.trim() ||
      value.name.length > 120 ||
      typeof value.lessonTitle !== 'string' ||
      !value.lessonTitle.trim() ||
      value.lessonTitle.length > 200 ||
      typeof value.studyUrl !== 'string' ||
      value.studyUrl.length > 2048 ||
      /[\r\n]/.test(value.studyUrl)
    )
      throw invalid();
    try {
      const url = new URL(value.studyUrl);
      if (url.protocol !== 'https:' || url.username || url.password)
        throw invalid();
    } catch {
      throw invalid();
    }
    return {
      template: 'study-reminder',
      to: value.to,
      name: value.name.trim(),
      lessonTitle: value.lessonTitle.trim(),
      studyUrl: value.studyUrl,
    };
  }
}
