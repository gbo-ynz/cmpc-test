import {
  NO_DETAILS,
  type Author,
  type AuthorDetails,
  type AuthorSummary,
} from '../modules/references/domain/author';
import { paginate, toSkip, type PageRequest, type Paginated } from '../shared/domain/pagination';
import { AuthorRepository } from '../modules/references/domain/author.repository';
import type { InMemoryReferenceRepository } from './in-memory-reference.repository';

/**
 * Keeps only the details; names, book counts and deletion live in the shared reference fake,
 * exactly like both adapters read the same "authors" table in Postgres.
 */
export class InMemoryAuthorRepository extends AuthorRepository {
  private readonly details = new Map<string, AuthorDetails>();

  constructor(private readonly references: InMemoryReferenceRepository) {
    super();
  }

  seed(name: string, details: Partial<AuthorDetails> = {}): Author {
    const reference = this.references.seed('authors', name);
    const full = { ...NO_DETAILS, ...details };
    this.details.set(reference.id, full);
    return { ...reference, ...full };
  }

  async list(): Promise<AuthorSummary[]> {
    const rows = await this.references.list('authors');
    return rows.map((row) => ({ ...row, ...this.detailsOf(row.id) }));
  }

  async listPage(request: PageRequest): Promise<Paginated<AuthorSummary>> {
    const all = await this.list();
    const start = toSkip(request);
    return paginate(all.slice(start, start + request.limit), all.length, request);
  }

  async findById(id: string): Promise<Author | null> {
    const reference = await this.references.findById('authors', id);
    return reference ? { ...reference, ...this.detailsOf(id) } : null;
  }

  async create(name: string, details: AuthorDetails): Promise<Author> {
    const reference = await this.references.create('authors', name);
    this.details.set(reference.id, details);
    return { ...reference, ...details };
  }

  async update(id: string, name: string, details: AuthorDetails): Promise<Author> {
    const reference = await this.references.rename('authors', id, name);
    this.details.set(id, details);
    return { ...reference, ...details };
  }

  private detailsOf(id: string): AuthorDetails {
    return this.details.get(id) ?? NO_DETAILS;
  }
}
