import { Injectable } from '@nestjs/common';
import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { AuditLogEntry, AuditLogFilter } from '../domain/audit-log';
import { AuditLogRepository } from '../domain/audit-log.repository';

@Injectable()
export class ListAuditLogsUseCase {
  constructor(private readonly auditLogs: AuditLogRepository) {}

  execute(request: PageRequest, filter: AuditLogFilter): Promise<Paginated<AuditLogEntry>> {
    return this.auditLogs.listPage(request, filter);
  }
}
