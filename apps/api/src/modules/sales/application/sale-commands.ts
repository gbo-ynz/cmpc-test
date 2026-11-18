import type { AuditAction, AuditEntry } from '../../../shared/application/audit-logger.port';
import type { Sale } from '../domain/sale';
import { SaleNotFoundError, SaleNotPendingError } from '../domain/sale.errors';
import type { SaleRepository } from '../domain/sale.repository';

export async function requireSale(sales: SaleRepository, id: string): Promise<Sale> {
  const found = await sales.findById(id);
  if (!found) throw new SaleNotFoundError(id);
  return found;
}

/** Completed and cancelled sales are final (RF-17 CA-1). */
export function ensurePending(sale: Sale): void {
  if (sale.status !== 'PENDING') throw new SaleNotPendingError();
}

export function saleAudit(
  action: AuditAction,
  sale: Sale,
  actorId: string,
  metadata: Record<string, unknown> = {},
): AuditEntry {
  const { total, items } = sale;
  return {
    action,
    entityType: 'Sale',
    entityId: sale.id,
    actorId,
    metadata: { total, lines: items.length, ...metadata },
  };
}
