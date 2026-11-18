import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { normalizeReferenceName, type Reference, type ReferenceKind } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit } from './reference-commands';

export interface CreateReferenceCommand {
  readonly kind: ReferenceKind;
  readonly name: string;
  readonly actorId: string;
}

@Injectable()
export class CreateReferenceUseCase {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ kind, name, actorId }: CreateReferenceCommand): Promise<Reference> {
    const normalized = normalizeReferenceName(kind, name);
    return this.transactions.run(async () => {
      await ensureNameAvailable(this.references, kind, normalized);
      const created = await this.references.create(kind, normalized);
      await this.audit.record(referenceAudit('CREATE', kind, created, actorId));
      return created;
    });
  }
}
