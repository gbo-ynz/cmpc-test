import { Injectable } from '@nestjs/common';
import {
  paginate,
  toSkip,
  type PageRequest,
  type Paginated,
} from '../../../../shared/domain/pagination';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Genre, GenreDetails, GenreSummary } from '../../domain/genre';
import { GenreRepository } from '../../domain/genre.repository';
import { ORDER_BY, SELECT, SUMMARY_SELECT, toColumns, toGenre, toSummary } from './genre.mapper';

@Injectable()
export class PrismaGenreRepository implements GenreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<GenreSummary[]> {
    const rows = await this.prisma.db.genre.findMany({
      select: SUMMARY_SELECT,
      orderBy: ORDER_BY,
    });
    return rows.map(toSummary);
  }

  async listPage(request: PageRequest): Promise<Paginated<GenreSummary>> {
    const [total, rows] = await Promise.all([
      this.prisma.db.genre.count(),
      this.prisma.db.genre.findMany({
        select: SUMMARY_SELECT,
        orderBy: ORDER_BY,
        skip: toSkip(request),
        take: request.limit,
      }),
    ]);
    return paginate(rows.map(toSummary), total, request);
  }

  async findById(id: string): Promise<Genre | null> {
    const row = await this.prisma.db.genre.findUnique({ where: { id }, select: SELECT });
    return row ? toGenre(row) : null;
  }

  async create(name: string, details: GenreDetails): Promise<Genre> {
    const data = toColumns(name, details);
    return toGenre(await this.prisma.db.genre.create({ data, select: SELECT }));
  }

  async update(id: string, name: string, details: GenreDetails): Promise<Genre> {
    const data = toColumns(name, details);
    return toGenre(await this.prisma.db.genre.update({ where: { id }, data, select: SELECT }));
  }
}
