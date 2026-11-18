import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

const context = {
  switchToHttp: () => ({
    getRequest: () => ({ method: 'GET', originalUrl: '/api/books' }),
    getResponse: () => ({ statusCode: 200 }),
  }),
} as unknown as ExecutionContext;

describe('RequestLoggingInterceptor', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs method, url and status on success', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const next: CallHandler = { handle: () => of('ok') };

    await lastValueFrom(new RequestLoggingInterceptor().intercept(context, next));

    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^GET \/api\/books 200 \d+ms$/));
  });

  it('logs a warning when the handler fails', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const next: CallHandler = { handle: () => throwError(() => new Error('boom')) };

    await expect(
      lastValueFrom(new RequestLoggingInterceptor().intercept(context, next)),
    ).rejects.toThrow('boom');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('failed'));
  });

  it('stringifies non-error rejections', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const next: CallHandler = { handle: () => throwError(() => 'plain') };

    await expect(
      lastValueFrom(new RequestLoggingInterceptor().intercept(context, next)),
    ).rejects.toBe('plain');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('plain'));
  });
});
