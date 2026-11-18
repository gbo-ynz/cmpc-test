import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { AllExceptionsFilter } from './shared/infrastructure/http/all-exceptions.filter';
import { HealthController } from './shared/infrastructure/http/health.controller';
import { RequestLoggingInterceptor } from './shared/infrastructure/http/request-logging.interceptor';
import { ResponseEnvelopeInterceptor } from './shared/infrastructure/http/response-envelope.interceptor';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

const RATE_LIMIT = { ttl: 60_000, limit: 120 };

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    ThrottlerModule.forRoot([RATE_LIMIT]),
    PrismaModule,
    AuditModule,
    AuthModule,
    BooksModule,
    CatalogModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule {}
