import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditEntry, AuditLogger } from '../../../../shared/application/audit-logger.port';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';

/**
 * Persists the audit trail in the same transaction as the business operation
 * (via `prisma.db`) and mirrors it to stdout for log aggregation.
 */
@Injectable()
export class PrismaAuditLogger implements AuditLogger {
  private readonly logger = new Logger('Audit');

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.db.auditLog.create({
      data: {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        userId: entry.actorId ?? null,
        metadata: entry.metadata as Prisma.InputJsonObject | undefined,
      },
    });
    this.logger.log(JSON.stringify(entry));
  }
}
