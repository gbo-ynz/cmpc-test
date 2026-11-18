import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import type { Sale } from '../domain/sale';
import { buildSale, type RequestedLine } from '../domain/sale-builder';
import { SaleStock } from '../domain/sale-stock';
import { SaleRepository } from '../domain/sale.repository';
import { saleAudit } from './sale-commands';

export interface CreateSaleCommand {
  readonly items: readonly RequestedLine[];
  readonly actorId: string;
}

/** Creates a PENDING sale. It does not reserve stock: only completing it discounts units. */
@Injectable()
export class CreateSaleUseCase {
  constructor(
    private readonly sales: SaleRepository,
    private readonly stock: SaleStock,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ items, actorId }: CreateSaleCommand): Promise<Sale> {
    return this.transactions.run(async () => {
      const books = await this.stock.findSellable(items.map((line) => line.bookId));
      const created = await this.sales.create(buildSale(actorId, items, books));
      await this.audit.record(saleAudit('CREATE', created, actorId));
      return created;
    });
  }
}
