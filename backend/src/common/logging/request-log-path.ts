import type { Request } from 'express';

/** Route templates exclude parameter values; baseUrl can contain them. */
export function getRequestLogPath(request: Request): string {
  const path: unknown = request.route?.path;
  return typeof path === 'string' &&
    path.startsWith('/') &&
    /^[a-zA-Z0-9_/:.*{}-]+$/.test(path)
    ? path
    : '[unmatched]';
}
