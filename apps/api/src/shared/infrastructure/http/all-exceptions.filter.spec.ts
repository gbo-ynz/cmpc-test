import { ArgumentsHost, Logger } from '@nestjs/common';
import { NotFoundError } from '../../domain/domain.error';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', originalUrl: '/api/books/1' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders domain errors with the error envelope', () => {
    const { host, status, json } = createHost();

    new AllExceptionsFilter().catch(new NotFoundError('Book 1 was not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Book 1 was not found', details: undefined },
        path: '/api/books/1',
      }),
    );
  });

  it('logs server errors with their stack trace', () => {
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const { host, status } = createHost();

    new AllExceptionsFilter().catch(new Error('boom'), host);
    new AllExceptionsFilter().catch('raw failure', host);

    expect(status).toHaveBeenCalledWith(500);
    expect(error).toHaveBeenCalledTimes(2);
  });
});
