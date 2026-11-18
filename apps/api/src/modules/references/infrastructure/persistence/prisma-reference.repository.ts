import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Reference, ReferenceKind, ReferenceSummary } from '../../domain/reference';
import { ReferenceRepository } from '../../domain/reference.repository';

/** The subset of a Prisma model delegate this adapter uses (author, publisher and genre share it). */
interface ReferenceDelegate {
  findMany(args: object): Promise<Array<Reference & { _count: { books: number } }>>;
  findFirst(args: object): Promise<Reference | null>;
  create(args: object): Promise<Reference>;
  update(args: object): Promise<Reference>;
  delete(args: object): Promise<unknown>;
}

const SELECT = { id: true, name: true } as const;
const FOREIGN_KEY = { authors: 'authorId', publishers: 'publisherId', genres: 'genreId' } as const;

@Injectable()
export class PrismaReferenceRepository implements ReferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(kind: ReferenceKind): Promise<ReferenceSummary[]> {
    const rows = await this.model(kind).findMany({
      select: { ...SELECT, _count: { select: { books: { where: { deletedAt: null } } } } },
      orderBy: { name: 'asc' },
    });
    return rows.map(({ id, name, _count }) => ({ id, name, activeBooks: _count.books }));
  }

  findById(kind: ReferenceKind, id: string): Promise<Reference | null> {
    return this.model(kind).findFirst({ where: { id }, select: SELECT });
  }

  findByName(kind: ReferenceKind, name: string): Promise<Reference | null> {
    const where = { name: { equals: name, mode: 'insensitive' } };
    return this.model(kind).findFirst({ where, select: SELECT });
  }

  create(kind: ReferenceKind, name: string): Promise<Reference> {
    return this.model(kind).create({ data: { name }, select: SELECT });
  }

  rename(kind: ReferenceKind, id: string, name: string): Promise<Reference> {
    return this.model(kind).update({ where: { id }, data: { name }, select: SELECT });
  }

  countBooks(kind: ReferenceKind, id: string): Promise<number> {
    return this.prisma.db.book.count({ where: { [FOREIGN_KEY[kind]]: id } });
  }

  async delete(kind: ReferenceKind, id: string): Promise<void> {
    await this.model(kind).delete({ where: { id } });
  }

  private model(kind: ReferenceKind): ReferenceDelegate {
    const { author, publisher, genre } = this.prisma.db;
    const models = { authors: author, publishers: publisher, genres: genre };
    return models[kind] as unknown as ReferenceDelegate;
  }
}
