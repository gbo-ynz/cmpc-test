import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import {
  NO_DETAILS,
  applyAuthorDetails,
  type Author,
  type AuthorDetailsInput,
} from '../domain/author';
import { AuthorRepository } from '../domain/author.repository';
import { normalizeReferenceName } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit } from './reference-commands';

export interface CreateAuthorCommand extends AuthorDetailsInput {
  readonly name: string;
  readonly actorId: string;
}

/** Same name rules as every catalog, plus optional birth date and biography. */
@Injectable()
export class CreateAuthorUseCase {
  constructor(
    private readonly authors: AuthorRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ name, actorId, ...input }: CreateAuthorCommand): Promise<Author> {
    const normalized = normalizeReferenceName('authors', name);
    const details = applyAuthorDetails(NO_DETAILS, input);
    return this.transactions.run(async () => {
      await ensureNameAvailable(this.references, 'authors', normalized);
      const created = await this.authors.create(normalized, details);
      await this.audit.record(
        referenceAudit('CREATE', 'authors', created, actorId, { ...details }),
      );
      return created;
    });
  }
}
