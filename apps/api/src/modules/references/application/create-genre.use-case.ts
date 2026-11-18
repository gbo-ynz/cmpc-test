import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import {
  NO_GENRE_DETAILS,
  applyGenreDetails,
  type Genre,
  type GenreDetailsInput,
} from '../domain/genre';
import { GenreRepository } from '../domain/genre.repository';
import { normalizeReferenceName } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit } from './reference-commands';

export interface CreateGenreCommand extends GenreDetailsInput {
  readonly name: string;
  readonly actorId: string;
}

/** Same name rules as every catalog, plus an optional description. */
@Injectable()
export class CreateGenreUseCase {
  constructor(
    private readonly genres: GenreRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  async execute({ name, actorId, ...input }: CreateGenreCommand): Promise<Genre> {
    const normalized = normalizeReferenceName('genres', name);
    const details = applyGenreDetails(NO_GENRE_DETAILS, input);
    return this.transactions.run(async () => {
      await ensureNameAvailable(this.references, 'genres', normalized);
      const created = await this.genres.create(normalized, details);
      await this.audit.record(referenceAudit('CREATE', 'genres', created, actorId, { ...details }));
      return created;
    });
  }
}
