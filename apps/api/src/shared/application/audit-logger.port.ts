export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD_IMAGE' | 'EXPORT' | 'LOGIN';

export interface AuditEntry {
  readonly action: AuditAction;
  readonly entityType: string;
  readonly entityId?: string;
  readonly actorId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Port for the operations audit trail. */
export abstract class AuditLogger {
  abstract record(entry: AuditEntry): Promise<void>;
}
