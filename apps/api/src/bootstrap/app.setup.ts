import { resolve } from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import type { EnvironmentVariables } from '../config/env.validation';

export const API_PREFIX = 'api';

/** Cross-cutting HTTP concerns: prefix, security headers, CORS, validation, static uploads. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: config.get('CORS_ORIGIN', { infer: true }).split(',') });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useStaticAssets(resolve(config.get('UPLOADS_DIR', { infer: true })), {
    prefix: `/${API_PREFIX}/uploads`,
    index: false,
    maxAge: '7d',
  });
  app.enableShutdownHooks();
}
