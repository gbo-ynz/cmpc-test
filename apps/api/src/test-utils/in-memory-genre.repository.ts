import {
  NO_GENRE_DETAILS,
  type Genre,
  type GenreDetails,
  type GenreSummary,
} from '../modules/references/domain/genre';
import { GenreRepository } from '../modules/references/domain/genre.repository';
import { paginate, toSkip, type PageRequest, type Paginated } from '../shared/domain/pagination';
import type { InMemoryReferenceRepository } from './in-memory-reference.repository';

/**
 * Keeps only the description; names, book counts and deletion live in the shared reference fake,
 * exactly like both adapters read the same "genres" table in Postgres.
 */
export class InMemoryGenreRepository extends GenreRepository {
  private readonly details = new Map<string, GenreDetails>();

  constructor(private readonly references: InMemoryReferenceRepository) {
    super();
  }

  seed(name: string, details: Partial<GenreDetails> = {}): Genre {
    const reference = this.references.seed('genres', name);
    const full = { ...NO_GENRE_DETAILS, ...details };
    this.details.set(reference.id, full);
    return { ...reference, ...full };
  }

  async list(): Promise<GenreSummary[]> {
    const rows = await this.references.list('genres');
    return rows.map((row) => ({ ...row, ...this.detailsOf(row.id) }));
  }

  async listPage(request: PageRequest): Promise<Paginated<GenreSummary>> {
    const all = await this.list();
    const start = toSkip(request);
    return paginate(all.slice(start, start + request.limit), all.length, request);
  }

  async findById(id: string): Promise<Genre | null> {
    const reference = await this.references.findById('genres', id);
    return reference ? { ...reference, ...this.detailsOf(id) } : null;
  }

  async create(name: string, details: GenreDetails): Promise<Genre> {
    const reference = await this.references.create('genres', name);
    this.details.set(reference.id, details);
    return { ...reference, ...details };
  }

  async update(id: string, name: string, details: GenreDetails): Promise<Genre> {
    const reference = await this.references.rename('genres', id, name);
    this.details.set(id, details);
    return { ...reference, ...details };
  }

  private detailsOf(id: string): GenreDetails {
    return this.details.get(id) ?? NO_GENRE_DETAILS;
  }
}
