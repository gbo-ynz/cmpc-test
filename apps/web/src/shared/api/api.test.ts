import {
  AxiosError,
  AxiosHeaders,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { sessionStorage } from '../auth/session-storage';
import { ApiError, toApiError } from './api-error';
import { unwrap, unwrapPage } from './envelope';
import { SESSION_EXPIRED_EVENT, attachToken, handleResponseError } from './http-client';

const SESSION = {
  token: 'jwt',
  user: { id: '1', email: 'a@b.cl', name: 'A', role: 'ADMIN' as const },
};

const axiosError = (status: number, data?: unknown) =>
  new AxiosError('Request failed', 'ERR', undefined, undefined, { status, data } as AxiosResponse);

describe('toApiError', () => {
  it('translates the backend error code into a user-facing message', () => {
    const error = toApiError(
      axiosError(400, {
        error: { code: 'BAD_REQUEST', message: 'Validation failed', details: ['x'] },
      }),
    );

    expect(error).toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Los datos enviados no son válidos.',
      details: ['x'],
    });
    expect(error.isClientError).toBe(true);
  });

  it.each([
    ['UNAUTHORIZED', 401, 'Correo electrónico o contraseña incorrectos.'],
    ['TOO_MANY_REQUESTS', 429, 'Demasiados intentos. Espere un minuto e intente nuevamente.'],
    ['INTERNAL_ERROR', 500, 'Ocurrió un error inesperado. Intente nuevamente más tarde.'],
  ])('maps %s', (code, status, message) => {
    expect(toApiError(axiosError(status, { error: { code } })).message).toBe(message);
  });

  it('explains network failures', () => {
    const error = toApiError(new AxiosError('Network Error'));

    expect(error).toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
    expect(error.message).toMatch(/No se pudo conectar con el servidor/);
    expect(error.isClientError).toBe(false);
  });

  it('never shows technical messages to the user', () => {
    expect(toApiError(axiosError(502)).message).toBe('Ocurrió un error inesperado.');
    expect(toApiError(new Error('Cannot read properties of undefined')).message).toBe(
      'Ocurrió un error inesperado.',
    );
    expect(toApiError('weird').code).toBe('UNKNOWN');
  });

  it('keeps ApiError instances untouched', () => {
    const existing = new ApiError('x', 404, 'NOT_FOUND');

    expect(toApiError(existing)).toBe(existing);
  });
});

describe('envelope helpers', () => {
  it('unwraps data and pages', () => {
    const meta = { total: 1, page: 1, limit: 10, totalPages: 1 };

    expect(unwrap({ data: { success: true, data: 5 } } as AxiosResponse)).toBe(5);
    expect(unwrapPage({ data: { success: true, data: [1], meta } } as AxiosResponse)).toEqual({
      items: [1],
      meta,
    });
    expect(unwrapPage({ data: { success: true, data: [1, 2] } } as AxiosResponse).meta.total).toBe(
      2,
    );
  });
});

describe('http client interceptors', () => {
  const config = () => ({ headers: new AxiosHeaders() }) as InternalAxiosRequestConfig;

  it('attaches the bearer token when a session exists', () => {
    sessionStorage.write(SESSION);

    expect(attachToken(config()).headers.get('Authorization')).toBe('Bearer jwt');
  });

  it('sends anonymous requests without a session', () => {
    expect(attachToken(config()).headers.get('Authorization')).toBeUndefined();
  });

  it('ends the session on 401', async () => {
    sessionStorage.write(SESSION);
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);

    await expect(handleResponseError(axiosError(401))).rejects.toBeInstanceOf(ApiError);

    expect(sessionStorage.read()).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });

  it('keeps the session on other errors', async () => {
    sessionStorage.write(SESSION);

    await expect(handleResponseError(axiosError(500))).rejects.toMatchObject({ status: 500 });
    expect(sessionStorage.read()).toEqual(SESSION);
  });
});
