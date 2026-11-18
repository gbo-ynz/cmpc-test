import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainError, DomainErrorCode } from '../../domain/domain.error';

export interface ResolvedError {
  readonly status: number;
  readonly code: string;
  readonly message: string;
  readonly details?: readonly string[];
}

const DOMAIN_STATUS: Record<DomainErrorCode, HttpStatus> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  VALIDATION: HttpStatus.BAD_REQUEST,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  CONFLICT: HttpStatus.CONFLICT,
};

const INTERNAL_ERROR: ResolvedError = {
  status: HttpStatus.INTERNAL_SERVER_ERROR,
  code: 'INTERNAL_ERROR',
  message: 'Unexpected error, please try again later',
};

function fromHttpException(exception: HttpException): ResolvedError {
  const status = exception.getStatus();
  const code = HttpStatus[status] ?? 'HTTP_ERROR';
  const body = exception.getResponse();
  const raw = typeof body === 'string' ? body : (body as { message?: unknown }).message;
  if (Array.isArray(raw)) {
    return { status, code, message: 'Validation failed', details: raw.map(String) };
  }
  return { status, code, message: typeof raw === 'string' ? raw : exception.message };
}

/** Translates any thrown value into a transport-agnostic error description. */
export function resolveError(exception: unknown): ResolvedError {
  if (exception instanceof DomainError) {
    return {
      status: DOMAIN_STATUS[exception.code],
      code: exception.code,
      message: exception.message,
    };
  }
  if (exception instanceof HttpException) return fromHttpException(exception);
  return INTERNAL_ERROR;
}
