import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  paginate,
  toSkip,
  type PageRequest,
  type Paginated,
} from '../../../../shared/domain/pagination';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { AuditLogEntry, AuditLogFilter } from '../../domain/audit-log';
import { AuditLogRepository } from '../../domain/audit-log.repository';
import { ENTRY_SELECT, ORDER_BY, toEntry } from './audit-log.mapper';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPage(request: PageRequest, filter: AuditLogFilter): Promise<Paginated<AuditLogEntry>> {
    const { from, to, ...exact } = filter;
    // Prisma skips a condition whose value is undefined, so only the filters sent apply.
    const where: Prisma.AuditLogWhereInput = { ...exact, createdAt: { gte: from, lte: to } };
    const [total, rows] = await Promise.all([
      this.prisma.db.auditLog.count({ where }),
      this.prisma.db.auditLog.findMany({
        where,
        select: ENTRY_SELECT,
        orderBy: ORDER_BY,
        skip: toSkip(request),
        take: request.limit,
      }),
    ]);
    return paginate(rows.map(toEntry), total, request);
  }
}
