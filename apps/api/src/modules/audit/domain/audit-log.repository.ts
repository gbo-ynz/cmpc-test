import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { AuditLogEntry, AuditLogFilter } from './audit-log';

/** Read side of the audit trail. Writing is the AuditLogger port: the trail is append-only. */
export abstract class AuditLogRepository {
  /** Newest first. */
  abstract listPage(
    request: PageRequest,
    filter: AuditLogFilter,
  ): Promise<Paginated<AuditLogEntry>>;
}
