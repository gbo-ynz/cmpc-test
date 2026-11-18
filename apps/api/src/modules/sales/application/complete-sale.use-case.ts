import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import type { PaymentMethod, Sale } from '../domain/sale';
import { SaleStock } from '../domain/sale-stock';
import { InsufficientStockError, SaleNotPendingError } from '../domain/sale.errors';
import { SaleRepository } from '../domain/sale.repository';
import { ensurePending, requireSale, saleAudit } from './sale-commands';

export interface CompleteSaleCommand {
  readonly id: string;
  readonly paymentMethod: PaymentMethod;
  readonly actorId: string;
}

/**
 * Discounts the stock of every line and closes the sale in ONE transaction: if any book runs short
 * (or was deleted) the error rolls everything back, so nothing is discounted (RF-17 CA-3 and CA-4).
 */
@Injectable()
export class CompleteSaleUseCase {
  constructor(
    private readonly sales: SaleRepository,
    private readonly stock: SaleStock,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ id, paymentMethod, actorId }: CompleteSaleCommand): Promise<Sale> {
    return this.transactions.run(async () => {
      const sale = await requireSale(this.sales, id);
      ensurePending(sale);
      for (const line of sale.items) {
        if (!(await this.stock.decrement(line.bookId, line.quantity))) {
          throw new InsufficientStockError(line.title);
        }
      }
      const completed = await this.sales.markCompleted(id, paymentMethod, new Date());
      if (!completed) throw new SaleNotPendingError();
      await this.audit.record(saleAudit('COMPLETE', completed, actorId, { paymentMethod }));
      return completed;
    });
  }
}
