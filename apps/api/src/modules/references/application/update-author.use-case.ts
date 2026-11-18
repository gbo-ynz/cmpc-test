import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { applyAuthorDetails, type Author, type AuthorDetailsInput } from '../domain/author';
import { AuthorRepository } from '../domain/author.repository';
import { normalizeReferenceName } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit } from './reference-commands';
import { requireAuthor } from './require-author';

/** Partial update: omitted fields keep their value; null clears a detail. */
export interface UpdateAuthorCommand extends AuthorDetailsInput {
  readonly id: string;
  readonly name?: string | null;
  readonly actorId: string;
}

@Injectable()
export class UpdateAuthorUseCase {
  constructor(
    private readonly authors: AuthorRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ id, name, actorId, ...input }: UpdateAuthorCommand): Promise<Author> {
    return this.transactions.run(async () => {
      const current = await requireAuthor(this.authors, id);
      const newName =
        name === undefined ? current.name : normalizeReferenceName('authors', name ?? '');
      const details = applyAuthorDetails(current, input);
      await ensureNameAvailable(this.references, 'authors', newName, id);
      const updated = await this.authors.update(id, newName, details);
      const { birthDate, biography } = current;
      const previous = { name: current.name, birthDate, biography };
      await this.audit.record(referenceAudit('UPDATE', 'authors', updated, actorId, { previous }));
      return updated;
    });
  }
}
