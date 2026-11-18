import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { resolveError } from './error-resolver';

const FIRST_SERVER_ERROR: number = HttpStatus.INTERNAL_SERVER_ERROR;

/** Single error contract for the whole API: `{ success: false, error }`. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { status, code, message, details } = resolveError(exception);

    if (status >= FIRST_SERVER_ERROR) {
      const trace = exception instanceof Error ? exception.stack : String(exception);
      this.logger.error(`${request.method} ${request.originalUrl}`, trace);
    }

    response.status(status).json({
      success: false,
      data: null,
      error: { code, message, details },
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    });
  }
}
