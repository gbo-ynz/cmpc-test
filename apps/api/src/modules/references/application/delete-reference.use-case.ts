import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import type { ReferenceKind } from '../domain/reference';
import { ReferenceInUseError } from '../domain/reference.errors';
import { ReferenceRepository } from '../domain/reference.repository';
import { referenceAudit, requireReference } from './reference-commands';

export interface DeleteReferenceCommand {
  readonly kind: ReferenceKind;
  readonly id: string;
  readonly actorId: string;
}

/** Hard delete, only when no book (active or soft-deleted) points to the record. */
@Injectable()
export class DeleteReferenceUseCase {
  constructor(
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ kind, id, actorId }: DeleteReferenceCommand): Promise<void> {
    return this.transactions.run(async () => {
      const reference = await requireReference(this.references, kind, id);
      const books = await this.references.countBooks(kind, id);
      if (books > 0) throw new ReferenceInUseError(books);
      await this.references.delete(kind, id);
      await this.audit.record(referenceAudit('DELETE', kind, reference, actorId));
    });
  }
}
