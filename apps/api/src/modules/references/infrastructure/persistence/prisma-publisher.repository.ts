import { Injectable } from '@nestjs/common';
import {
  paginate,
  toSkip,
  type PageRequest,
  type Paginated,
} from '../../../../shared/domain/pagination';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { Publisher, PublisherDetails, PublisherSummary } from '../../domain/publisher';
import { PublisherRepository } from '../../domain/publisher.repository';
import {
  ORDER_BY,
  SELECT,
  SUMMARY_SELECT,
  toColumns,
  toPublisher,
  toSummary,
} from './publisher.mapper';

@Injectable()
export class PrismaPublisherRepository implements PublisherRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PublisherSummary[]> {
    const rows = await this.prisma.db.publisher.findMany({
      select: SUMMARY_SELECT,
      orderBy: ORDER_BY,
    });
    return rows.map(toSummary);
  }

  async listPage(request: PageRequest): Promise<Paginated<PublisherSummary>> {
    const [total, rows] = await Promise.all([
      this.prisma.db.publisher.count(),
      this.prisma.db.publisher.findMany({
        select: SUMMARY_SELECT,
        orderBy: ORDER_BY,
        skip: toSkip(request),
        take: request.limit,
      }),
    ]);
    return paginate(rows.map(toSummary), total, request);
  }

  async findById(id: string): Promise<Publisher | null> {
    const row = await this.prisma.db.publisher.findUnique({ where: { id }, select: SELECT });
    return row ? toPublisher(row) : null;
  }

  async create(name: string, details: PublisherDetails): Promise<Publisher> {
    const data = toColumns(name, details);
    return toPublisher(await this.prisma.db.publisher.create({ data, select: SELECT }));
  }

  async update(id: string, name: string, details: PublisherDetails): Promise<Publisher> {
    const data = toColumns(name, details);
    return toPublisher(
      await this.prisma.db.publisher.update({ where: { id }, data, select: SELECT }),
    );
  }
}
