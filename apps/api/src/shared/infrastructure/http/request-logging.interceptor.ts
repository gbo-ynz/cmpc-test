import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/** Structured access log: method, url, status and latency of every request. */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const startedAt = Date.now();
    const label = `${request.method} ${request.originalUrl}`;

    return next.handle().pipe(
      tap({
        complete: () => {
          const status = http.getResponse<Response>().statusCode;
          this.logger.log(`${label} ${status} ${Date.now() - startedAt}ms`);
        },
        error: (error: unknown) => {
          const reason = error instanceof Error ? error.message : String(error);
          this.logger.warn(`${label} failed after ${Date.now() - startedAt}ms: ${reason}`);
        },
      }),
    );
  }
}
