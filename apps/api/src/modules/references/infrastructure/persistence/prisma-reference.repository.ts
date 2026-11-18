import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Reference, ReferenceKind } from '../../domain/reference';
import { ReferenceRepository } from '../../domain/reference.repository';

/** The subset of a Prisma model delegate this adapter uses (author, publisher and genre share it). */
interface ReferenceDelegate {
  findFirst(args: object): Promise<Reference | null>;
  delete(args: object): Promise<unknown>;
}

const SELECT = { id: true, name: true } as const;
const FOREIGN_KEY = { authors: 'authorId', publishers: 'publisherId', genres: 'genreId' } as const;

@Injectable()
export class PrismaReferenceRepository implements ReferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(kind: ReferenceKind, id: string): Promise<Reference | null> {
    return this.model(kind).findFirst({ where: { id }, select: SELECT });
  }

  findByName(kind: ReferenceKind, name: string): Promise<Reference | null> {
    const where = { name: { equals: name, mode: 'insensitive' } };
    return this.model(kind).findFirst({ where, select: SELECT });
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
    return models[kind];
  }
}
