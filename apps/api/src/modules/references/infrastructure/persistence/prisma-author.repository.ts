import { Injectable } from '@nestjs/common';
import {
  paginate,
  toSkip,
  type PageRequest,
  type Paginated,
} from '../../../../shared/domain/pagination';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Author, AuthorDetails, AuthorSummary } from '../../domain/author';
import { AuthorRepository } from '../../domain/author.repository';
import { ORDER_BY, SELECT, SUMMARY_SELECT, toAuthor, toColumns, toSummary } from './author.mapper';

@Injectable()
export class PrismaAuthorRepository implements AuthorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<AuthorSummary[]> {
    const rows = await this.prisma.db.author.findMany({
      select: SUMMARY_SELECT,
      orderBy: ORDER_BY,
    });
    return rows.map(toSummary);
  }

  async listPage(request: PageRequest): Promise<Paginated<AuthorSummary>> {
    const [total, rows] = await Promise.all([
      this.prisma.db.author.count(),
      this.prisma.db.author.findMany({
        select: SUMMARY_SELECT,
        orderBy: ORDER_BY,
        skip: toSkip(request),
        take: request.limit,
      }),
    ]);
    return paginate(rows.map(toSummary), total, request);
  }

  async findById(id: string): Promise<Author | null> {
    const row = await this.prisma.db.author.findUnique({ where: { id }, select: SELECT });
    return row ? toAuthor(row) : null;
  }

  async create(name: string, details: AuthorDetails): Promise<Author> {
    const data = toColumns(name, details);
    return toAuthor(await this.prisma.db.author.create({ data, select: SELECT }));
  }

  async update(id: string, name: string, details: AuthorDetails): Promise<Author> {
    const data = toColumns(name, details);
    return toAuthor(await this.prisma.db.author.update({ where: { id }, data, select: SELECT }));
  }
}
