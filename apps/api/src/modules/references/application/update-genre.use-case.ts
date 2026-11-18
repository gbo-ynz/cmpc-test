import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { applyGenreDetails, type Genre, type GenreDetailsInput } from '../domain/genre';
import { GenreRepository } from '../domain/genre.repository';
import { normalizeReferenceName } from '../domain/reference';
import { ReferenceRepository } from '../domain/reference.repository';
import { ensureNameAvailable, referenceAudit } from './reference-commands';
import { requireGenre } from './require-genre';

/** Partial update: omitted fields keep their value; null clears the description. */
export interface UpdateGenreCommand extends GenreDetailsInput {
  readonly id: string;
  readonly name?: string | null;
  readonly actorId: string;
}

@Injectable()
export class UpdateGenreUseCase {
  constructor(
    private readonly genres: GenreRepository,
    private readonly references: ReferenceRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ id, name, actorId, ...input }: UpdateGenreCommand): Promise<Genre> {
    return this.transactions.run(async () => {
      const current = await requireGenre(this.genres, id);
      const newName =
        name === undefined ? current.name : normalizeReferenceName('genres', name ?? '');
      const details = applyGenreDetails(current, input);
      await ensureNameAvailable(this.references, 'genres', newName, id);
      const updated = await this.genres.update(id, newName, details);
      const previous = { name: current.name, description: current.description };
      await this.audit.record(referenceAudit('UPDATE', 'genres', updated, actorId, { previous }));
      return updated;
    });
  }
}
