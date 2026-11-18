import {
  NO_PUBLISHER_DETAILS,
  type Publisher,
  type PublisherDetails,
  type PublisherSummary,
} from '../modules/references/domain/publisher';
import { PublisherRepository } from '../modules/references/domain/publisher.repository';
import { paginate, toSkip, type PageRequest, type Paginated } from '../shared/domain/pagination';
import type { InMemoryReferenceRepository } from './in-memory-reference.repository';

/**
 * Keeps only the country; names, book counts and deletion live in the shared reference fake,
 * exactly like both adapters read the same "publishers" table in Postgres.
 */
export class InMemoryPublisherRepository extends PublisherRepository {
  private readonly details = new Map<string, PublisherDetails>();

  constructor(private readonly references: InMemoryReferenceRepository) {
    super();
  }

  seed(name: string, details: Partial<PublisherDetails> = {}): Publisher {
    const reference = this.references.seed('publishers', name);
    const full = { ...NO_PUBLISHER_DETAILS, ...details };
    this.details.set(reference.id, full);
    return { ...reference, ...full };
  }

  async list(): Promise<PublisherSummary[]> {
    const rows = await this.references.list('publishers');
    return rows.map((row) => ({ ...row, ...this.detailsOf(row.id) }));
  }

  async listPage(request: PageRequest): Promise<Paginated<PublisherSummary>> {
    const all = await this.list();
    const start = toSkip(request);
    return paginate(all.slice(start, start + request.limit), all.length, request);
  }

  async findById(id: string): Promise<Publisher | null> {
    const reference = await this.references.findById('publishers', id);
    return reference ? { ...reference, ...this.detailsOf(id) } : null;
  }

  async create(name: string, details: PublisherDetails): Promise<Publisher> {
    const reference = await this.references.create('publishers', name);
    this.details.set(reference.id, details);
    return { ...reference, ...details };
  }

  async update(id: string, name: string, details: PublisherDetails): Promise<Publisher> {
    const reference = await this.references.rename('publishers', id, name);
    this.details.set(id, details);
    return { ...reference, ...details };
  }

  private detailsOf(id: string): PublisherDetails {
    return this.details.get(id) ?? NO_PUBLISHER_DETAILS;
  }
}
