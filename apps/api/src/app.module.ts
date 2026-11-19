import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BooksModule } from './modules/books/books.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { ReferencesModule } from './modules/references/references.module';
import { SalesModule } from './modules/sales/sales.module';
import { UsersModule } from './modules/users/users.module';
import { AllExceptionsFilter } from './shared/infrastructure/http/all-exceptions.filter';
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
    DashboardModule,
    HealthModule,
    ReferencesModule,
    SalesModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class AppModule {}
