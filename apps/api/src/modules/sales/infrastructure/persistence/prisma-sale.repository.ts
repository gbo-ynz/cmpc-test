import { Injectable } from '@nestjs/common';
import {
  paginate,
  toSkip,
  type PageRequest,
  type Paginated,
} from '../../../../shared/domain/pagination';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { NewSale, PaymentMethod, Sale, SaleStatus, SaleSummary } from '../../domain/sale';
import { SaleRepository } from '../../domain/sale.repository';
import { DETAIL_SELECT, ORDER_BY, SUMMARY_SELECT, toSale, toSummary } from './sale.mapper';

@Injectable()
export class PrismaSaleRepository implements SaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPage(request: PageRequest, status?: SaleStatus): Promise<Paginated<SaleSummary>> {
    const where = status ? { status } : {};
    const [total, rows] = await Promise.all([
      this.prisma.db.sale.count({ where }),
      this.prisma.db.sale.findMany({
        where,
        select: SUMMARY_SELECT,
        orderBy: ORDER_BY,
        skip: toSkip(request),
        take: request.limit,
      }),
    ]);
    return paginate(rows.map(toSummary), total, request);
  }

  async findById(id: string): Promise<Sale | null> {
    const row = await this.prisma.db.sale.findUnique({ where: { id }, select: DETAIL_SELECT });
    return row ? toSale(row) : null;
  }

  async create({ createdById, total, items }: NewSale): Promise<Sale> {
    const lines = items.map((line) => ({ ...line, unitPrice: line.unitPrice.toFixed(2) }));
    const data = { createdById, total: total.toFixed(2), items: { create: lines } };
    return toSale(await this.prisma.db.sale.create({ data, select: DETAIL_SELECT }));
  }

  markCompleted(id: string, method: PaymentMethod, at: Date): Promise<Sale | null> {
    return this.closePending(id, { status: 'COMPLETED', paymentMethod: method, completedAt: at });
  }

  markCancelled(id: string, at: Date): Promise<Sale | null> {
    return this.closePending(id, { status: 'CANCELLED', cancelledAt: at });
  }

  /** The `status: PENDING` condition makes the transition atomic: only one request can win. */
  private async closePending(id: string, data: object): Promise<Sale | null> {
    const { count } = await this.prisma.db.sale.updateMany({
      where: { id, status: 'PENDING' },
      data,
    });
    return count === 0 ? null : this.findById(id);
  }
}
