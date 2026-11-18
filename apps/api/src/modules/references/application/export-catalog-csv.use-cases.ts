import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { AuthorRepository } from '../domain/author.repository';
import { GenreRepository } from '../domain/genre.repository';
import { PublisherRepository } from '../domain/publisher.repository';
import { REFERENCE_KINDS, type ReferenceKind } from '../domain/reference';
import { authorsToCsv, genresToCsv, publishersToCsv } from './catalog-csv';

/** Catalogs are small (names and a few details): the whole file is built in memory. */
async function recordExport(
  audit: AuditLogger,
  kind: ReferenceKind,
  actorId: string,
  rows: number,
) {
  await audit.record({
    action: 'EXPORT',
    entityType: REFERENCE_KINDS[kind].entityType,
    actorId,
    metadata: { rows },
  });
}

/** Every author (not only the current page), sorted by name. */
@Injectable()
export class ExportAuthorsCsvUseCase {
  constructor(
    private readonly authors: AuthorRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string): Promise<string> {
    const authors = await this.authors.list();
    await recordExport(this.audit, 'authors', actorId, authors.length);
    return authorsToCsv(authors);
  }
}

@Injectable()
export class ExportPublishersCsvUseCase {
  constructor(
    private readonly publishers: PublisherRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string): Promise<string> {
    const publishers = await this.publishers.list();
    await recordExport(this.audit, 'publishers', actorId, publishers.length);
    return publishersToCsv(publishers);
  }
}

@Injectable()
export class ExportGenresCsvUseCase {
  constructor(
    private readonly genres: GenreRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string): Promise<string> {
    const genres = await this.genres.list();
    await recordExport(this.audit, 'genres', actorId, genres.length);
    return genresToCsv(genres);
  }
}
