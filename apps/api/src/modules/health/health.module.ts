import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/** Liveness plus a database check (`GET /api/health`), public for orchestrators and Docker. */
@Module({ controllers: [HealthController] })
export class HealthModule {}
