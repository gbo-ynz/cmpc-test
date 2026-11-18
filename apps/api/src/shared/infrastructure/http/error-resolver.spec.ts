import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../../domain/domain.error';
import { resolveError } from './error-resolver';

describe('resolveError', () => {
  it.each([
    [new NotFoundError('missing'), 404, 'NOT_FOUND'],
    [new ValidationError('bad'), 400, 'VALIDATION'],
    [new UnauthorizedError('nope'), 401, 'UNAUTHORIZED'],
    [new ConflictError('dup'), 409, 'CONFLICT'],
  ])('maps domain errors to HTTP (%#)', (error, status, code) => {
    expect(resolveError(error)).toEqual({ status, code, message: error.message });
  });

  it('exposes class-validator messages as details', () => {
    const exception = new BadRequestException(['title should not be empty']);

    expect(resolveError(exception)).toEqual({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Validation failed',
      details: ['title should not be empty'],
    });
  });

  it('keeps the message of regular HTTP exceptions', () => {
    expect(resolveError(new NotFoundException('Route not found'))).toMatchObject({
      status: 404,
      message: 'Route not found',
    });
  });

  it('handles string responses and unknown status codes', () => {
    expect(resolveError(new HttpException('teapot', 418))).toMatchObject({
      status: 418,
      message: 'teapot',
    });
    expect(resolveError(new HttpException({ other: true }, 599))).toMatchObject({
      code: 'HTTP_ERROR',
    });
  });

  it('hides internals of unexpected errors', () => {
    expect(resolveError(new Error('db password leaked'))).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error, please try again later',
    });
  });
});
