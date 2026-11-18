import { Injectable } from '@nestjs/common';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import type { Sale } from '../domain/sale';
import { SaleNotPendingError } from '../domain/sale.errors';
import { SaleRepository } from '../domain/sale.repository';
import { ensurePending, requireSale, saleAudit } from './sale-commands';

/** Cancelling never touches the stock: a pending sale had not discounted any. */
@Injectable()
export class CancelSaleUseCase {
  constructor(
    private readonly sales: SaleRepository,
    private readonly transactions: TransactionManager,
    private readonly audit: AuditLogger,
  ) {}

  execute({ id, actorId }: { id: string; actorId: string }): Promise<Sale> {
    return this.transactions.run(async () => {
      ensurePending(await requireSale(this.sales, id));
      const cancelled = await this.sales.markCancelled(id, new Date());
      if (!cancelled) throw new SaleNotPendingError();
      await this.audit.record(saleAudit('CANCEL', cancelled, actorId));
      return cancelled;
    });
  }
}
