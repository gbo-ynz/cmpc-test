import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { BookStats, CatalogStats, GenreBookCount, SalesStats } from '../../domain/dashboard';
import { DashboardRepository } from '../../domain/dashboard.repository';
import { ACTIVITY_ORDER, ACTIVITY_SELECT, sortGenres, toActivity } from './dashboard.mapper';

const ACTIVE = { deletedAt: null } as const;

@Injectable()
export class PrismaDashboardRepository implements DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async bookStats(): Promise<BookStats> {
    const [active, available] = await Promise.all([
      this.prisma.db.book.count({ where: ACTIVE }),
      this.prisma.db.book.count({ where: { ...ACTIVE, stock: { gt: 0 } } }),
    ]);
    return { active, available, unavailable: active - available };
  }

  async booksByGenre(): Promise<GenreBookCount[]> {
    const rows = await this.prisma.db.genre.findMany({
      select: { name: true, _count: { select: { books: { where: ACTIVE } } } },
    });
    return sortGenres(rows.map((row) => ({ genre: row.name, books: row._count.books })));
  }

  async salesStats(): Promise<SalesStats> {
    const [pending, completed] = await Promise.all([
      this.prisma.db.sale.count({ where: { status: 'PENDING' } }),
      this.prisma.db.sale.aggregate({
        where: { status: 'COMPLETED' },
        _count: true,
        _sum: { total: true },
      }),
    ]);
    const amount = completed._sum.total?.toNumber() ?? 0;
    return { pending, completed: completed._count, completedAmount: amount };
  }

  async inventoryValue(): Promise<number> {
    // price x stock per row cannot be expressed with Prisma aggregates: one SUM in SQL.
    const rows = await this.prisma.db.$queryRaw<Array<{ value: string }>>`
      SELECT COALESCE(SUM(price * stock), 0)::text AS value
      FROM books WHERE deleted_at IS NULL AND stock > 0`;
    return Number(rows[0].value);
  }

  async catalogStats(): Promise<CatalogStats> {
    const { author, publisher, genre, user } = this.prisma.db;
    const [authors, publishers, genres, users] = await Promise.all([
      author.count(),
      publisher.count(),
      genre.count(),
      user.count({ where: ACTIVE }),
    ]);
    return { authors, publishers, genres, users };
  }

  async recentActivity(limit: number) {
    const rows = await this.prisma.db.auditLog.findMany({
      select: ACTIVITY_SELECT,
      orderBy: ACTIVITY_ORDER,
      take: limit,
    });
    return rows.map(toActivity);
  }
}
