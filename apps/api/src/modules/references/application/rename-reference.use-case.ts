import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { normalizeReferenceName, type Reference, type ReferenceKind } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit, requireReference } from './reference-commands';

export interface RenameReferenceCommand {
  readonly kind: ReferenceKind;
  readonly id: string;
  readonly name: string;
  readonly actorId: string;
}

@Injectable()
export class RenameReferenceUseCase {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ kind, id, name, actorId }: RenameReferenceCommand): Promise<Reference> {
    const normalized = normalizeReferenceName(kind, name);
    return this.transactions.run(async () => {
      const current = await requireReference(this.references, kind, id);
      await ensureNameAvailable(this.references, kind, normalized, id);
      const renamed = await this.references.rename(kind, id, normalized);
      const metadata = { previousName: current.name };
      await this.audit.record(referenceAudit('UPDATE', kind, renamed, actorId, metadata));
      return renamed;
    });
  }
}
