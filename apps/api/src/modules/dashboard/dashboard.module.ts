import { Module } from '@nestjs/common';
import { GetDashboardUseCase } from './application/get-dashboard.use-case';
import { DashboardRepository } from './domain/dashboard.repository';
import { PrismaDashboardRepository } from './infrastructure/persistence/prisma-dashboard.repository';
import { DashboardController } from './presentation/dashboard.controller';

/** The system's main figures (RF-09), read-only. */
@Module({
  controllers: [DashboardController],
  providers: [
    GetDashboardUseCase,
    { provide: DashboardRepository, useClass: PrismaDashboardRepository },
  ],
})
export class DashboardModule {}
