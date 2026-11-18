import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Catalog, CatalogRepository } from '../../domain/catalog';

// EXISTS on active books, served by the (deleted_at, <fk>) indexes on books.
const ITEM_QUERY = {
  where: { books: { some: { deletedAt: null } } },
  select: { id: true, name: true },
  orderBy: { name: 'asc' },
} as const;

@Injectable()
export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async load(): Promise<Catalog> {
    const [authors, publishers, genres] = await Promise.all([
      this.prisma.db.author.findMany(ITEM_QUERY),
      this.prisma.db.publisher.findMany(ITEM_QUERY),
      this.prisma.db.genre.findMany(ITEM_QUERY),
    ]);
    return { authors, publishers, genres };
  }
}
