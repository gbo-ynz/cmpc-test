import { Global, Module } from '@nestjs/common';
import { AuditLogger } from '../../shared/application/audit-logger.port';
import { PrismaAuditLogger } from './infrastructure/persistence/prisma-audit-logger';

@Global()
@Module({
  providers: [{ provide: AuditLogger, useClass: PrismaAuditLogger }],
  exports: [AuditLogger],
})
export class AuditModule {}
