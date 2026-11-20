import type { Request } from 'express';
import { getRequestLogPath } from '../../../../src/common/logging/request-log-path.js';

describe('getRequestLogPath', () => {
  it.each([
    undefined,
    /private-token/,
    ['/private-token'],
    '/bad\npath',
    '/bad?token=private',
  ])('uses a fixed fallback for unsupported route metadata (%s)', (path) => {
    const request = {
      route: { path },
      originalUrl: '/private-token',
    } as Request;
    expect(getRequestLogPath(request)).toBe('[unmatched]');
  });
});
