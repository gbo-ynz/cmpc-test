import { Global, Module } from '@nestjs/common';
import { AuditLogger } from '../../shared/application/audit-logger.port';
import { ListAuditLogsUseCase } from './application/list-audit-logs.use-case';
import { AuditLogRepository } from './domain/audit-log.repository';
import { PrismaAuditLogRepository } from './infrastructure/persistence/prisma-audit-log.repository';
import { PrismaAuditLogger } from './infrastructure/persistence/prisma-audit-logger';
import { AuditLogsController } from './presentation/audit-logs.controller';

/** Writes the audit trail (global port) and lets administrators read it. */
@Global()
@Module({
  controllers: [AuditLogsController],
  providers: [
    { provide: AuditLogger, useClass: PrismaAuditLogger },
    { provide: AuditLogRepository, useClass: PrismaAuditLogRepository },
    ListAuditLogsUseCase,
  ],
  exports: [AuditLogger],
})
export class AuditModule {}
