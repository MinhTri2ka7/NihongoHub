import { HttpStatus } from '@nestjs/common';

/** Stable machine-readable codes. Add new application error codes here. */
export enum ErrorCode {
  HTTP_ERROR = 'HTTP_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  CONFLICT = 'CONFLICT',
  GONE = 'GONE',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE = 'UNSUPPORTED_MEDIA_TYPE',
  UNPROCESSABLE_ENTITY = 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  BAD_GATEWAY = 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

  // Application examples: use these instead of duplicating string literals.
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  AUTH_PROVIDER_UNAVAILABLE = 'AUTH_PROVIDER_UNAVAILABLE',
  DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE',
}

const codes = new Set<string>(Object.values(ErrorCode));

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && codes.has(value);
}

const httpErrorCodes: Readonly<Partial<Record<number, ErrorCode>>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.METHOD_NOT_ALLOWED]: ErrorCode.METHOD_NOT_ALLOWED,
  [HttpStatus.REQUEST_TIMEOUT]: ErrorCode.REQUEST_TIMEOUT,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.GONE]: ErrorCode.GONE,
  [HttpStatus.PAYLOAD_TOO_LARGE]: ErrorCode.PAYLOAD_TOO_LARGE,
  [HttpStatus.UNSUPPORTED_MEDIA_TYPE]: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
  [HttpStatus.UNPROCESSABLE_ENTITY]: ErrorCode.UNPROCESSABLE_ENTITY,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
  [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_SERVER_ERROR,
  [HttpStatus.NOT_IMPLEMENTED]: ErrorCode.NOT_IMPLEMENTED,
  [HttpStatus.BAD_GATEWAY]: ErrorCode.BAD_GATEWAY,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
  [HttpStatus.GATEWAY_TIMEOUT]: ErrorCode.GATEWAY_TIMEOUT,
};

export function getErrorCodeForStatus(statusCode: number): ErrorCode {
  return (
    httpErrorCodes[statusCode] ??
    (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR
      ? ErrorCode.INTERNAL_SERVER_ERROR
      : ErrorCode.HTTP_ERROR)
  );
}
