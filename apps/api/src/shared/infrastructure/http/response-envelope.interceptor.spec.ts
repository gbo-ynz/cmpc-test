import { CallHandler, ExecutionContext, StreamableFile } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { paginate } from '../../domain/pagination';
import { ResponseEnvelopeInterceptor, wrapResponse } from './response-envelope.interceptor';

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps plain payloads into the success envelope', async () => {
    const next: CallHandler = { handle: () => of({ id: 1 }) };

    const result = await lastValueFrom(
      new ResponseEnvelopeInterceptor().intercept({} as ExecutionContext, next),
    );

    expect(result).toEqual({ success: true, data: { id: 1 } });
  });

  it('lifts pagination metadata to the envelope', () => {
    const page = paginate(['a'], 1, { page: 1, limit: 10 });

    expect(wrapResponse(page)).toEqual({ success: true, data: ['a'], meta: page.meta });
  });

  it('normalizes empty bodies to null data', () => {
    expect(wrapResponse(undefined)).toEqual({ success: true, data: null });
  });

  it('leaves file streams untouched', () => {
    const file = new StreamableFile(Buffer.from('csv'));

    expect(wrapResponse(file)).toBe(file);
  });
});
