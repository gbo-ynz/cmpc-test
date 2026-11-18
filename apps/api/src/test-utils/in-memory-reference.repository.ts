import { randomUUID } from 'node:crypto';
import type {
  Reference,
  ReferenceKind,
  ReferenceSummary,
} from '../modules/references/domain/reference';
import { ReferenceRepository } from '../modules/references/domain/reference.repository';

interface Stored extends Reference {
  activeBooks: number;
  totalBooks: number;
}

/** Fake with the same contract as the Prisma adapter (sorted list, case-insensitive names). */
export class InMemoryReferenceRepository extends ReferenceRepository {
  private readonly rows = new Map<string, Stored & { kind: ReferenceKind }>();

  seed(
    kind: ReferenceKind,
    name: string,
    books = { active: 0, total: 0 },
    id: string = randomUUID(),
  ): Reference {
    const row = { id, name, kind, activeBooks: books.active, totalBooks: books.total };
    this.rows.set(row.id, row);
    return { id: row.id, name };
  }

  async list(kind: ReferenceKind): Promise<ReferenceSummary[]> {
    return this.of(kind)
      .map(({ id, name, activeBooks }) => ({ id, name, activeBooks }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(kind: ReferenceKind, id: string): Promise<Reference | null> {
    const row = this.of(kind).find((candidate) => candidate.id === id);
    return row ? { id: row.id, name: row.name } : null;
  }

  async findByName(kind: ReferenceKind, name: string): Promise<Reference | null> {
    const row = this.of(kind).find(
      (candidate) => candidate.name.toLowerCase() === name.toLowerCase(),
    );
    return row ? { id: row.id, name: row.name } : null;
  }

  async create(kind: ReferenceKind, name: string): Promise<Reference> {
    return this.seed(kind, name);
  }

  async rename(kind: ReferenceKind, id: string, name: string): Promise<Reference> {
    const row = this.rows.get(id);
    if (row) this.rows.set(id, { ...row, name });
    return { id, name };
  }

  async countBooks(_kind: ReferenceKind, id: string): Promise<number> {
    return this.rows.get(id)?.totalBooks ?? 0;
  }

  async delete(_kind: ReferenceKind, id: string): Promise<void> {
    this.rows.delete(id);
  }

  private of(kind: ReferenceKind) {
    return [...this.rows.values()].filter((row) => row.kind === kind);
  }
}
