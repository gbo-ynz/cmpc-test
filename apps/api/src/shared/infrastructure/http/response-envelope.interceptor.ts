import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { PageMeta, isPaginated } from '../../domain/pagination';

export interface SuccessEnvelope<T> {
  readonly success: true;
  readonly data: T;
  readonly meta?: PageMeta;
}

/** Normalizes every successful response into `{ success, data, meta? }`. */
export function wrapResponse(body: unknown): SuccessEnvelope<unknown> | StreamableFile {
  if (body instanceof StreamableFile) return body;
  if (isPaginated(body)) return { success: true, data: body.items, meta: body.meta };
  return { success: true, data: body ?? null };
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((body: unknown) => wrapResponse(body)));
  }
}
