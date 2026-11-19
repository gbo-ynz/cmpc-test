import type { AuditAction } from '../../../shared/application/audit-logger.port';

/** Who did it. Null when nobody can be credited: a failed sign-in, or a user deleted since. */
export interface AuditActor {
  readonly id: string;
  readonly name: string;
}

/** One line of the audit trail, as an administrator reads it. */
export interface AuditLogEntry {
  readonly id: string;
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId: string | null;
  readonly actor: AuditActor | null;
  readonly metadata: unknown;
  readonly createdAt: Date;
}

/** Every field narrows the trail; `from` and `to` are inclusive. */
export interface AuditLogFilter {
  readonly action?: AuditAction;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly userId?: string;
  readonly from?: Date;
  readonly to?: Date;
}
