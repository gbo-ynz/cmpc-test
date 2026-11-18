import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { SellableBook } from '../../domain/sale';
import { SaleStock } from '../../domain/sale-stock';

@Injectable()
export class PrismaSaleStock implements SaleStock {
  constructor(private readonly prisma: PrismaService) {}

  async findSellable(ids: readonly string[]): Promise<SellableBook[]> {
    const rows = await this.prisma.db.book.findMany({
      where: { id: { in: [...ids] }, deletedAt: null },
      select: { id: true, title: true, price: true, stock: true },
    });
    return rows.map((row) => ({ ...row, price: row.price.toNumber() }));
  }

  async decrement(bookId: string, quantity: number): Promise<boolean> {
    // One conditional UPDATE: the database arbitrates concurrent sales, never an earlier read.
    const { count } = await this.prisma.db.book.updateMany({
      where: { id: bookId, deletedAt: null, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    return count === 1;
  }
}
