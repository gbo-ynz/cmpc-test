import { isAxiosError, type AxiosError } from 'axios';
import { DEFAULT_ERROR_MESSAGE, messageForCode } from './error-messages';

interface ErrorBody {
  error?: { code?: string; details?: string[] };
}

/** Single error type for the whole UI, built from the API error envelope. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

const readErrorBody = (error: AxiosError<ErrorBody>): NonNullable<ErrorBody['error']> =>
  error.response?.data?.error ?? {};

function fromAxiosError(error: AxiosError<ErrorBody>): ApiError {
  const status = error.response?.status ?? 0;
  const { code = status === 0 ? 'NETWORK_ERROR' : 'HTTP_ERROR', details } = readErrorBody(error);
  return new ApiError(messageForCode(code), status, code, details);
}

/** Technical messages (stack traces, English server text) never reach the user. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError<ErrorBody>(error)) return fromAxiosError(error);
  return new ApiError(DEFAULT_ERROR_MESSAGE, 0, 'UNKNOWN');
}
