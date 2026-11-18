import type { PageRequest, Paginated } from '../../../shared/domain/pagination';
import type { NewSale, PaymentMethod, Sale, SaleStatus, SaleSummary } from './sale';

export abstract class SaleRepository {
  /** Newest first; optionally only the sales in one status. */
  abstract listPage(request: PageRequest, status?: SaleStatus): Promise<Paginated<SaleSummary>>;
  abstract findById(id: string): Promise<Sale | null>;
  abstract create(sale: NewSale): Promise<Sale>;
  /** Only moves a PENDING sale; null when it was no longer pending (another request got there first). */
  abstract markCompleted(id: string, method: PaymentMethod, at: Date): Promise<Sale | null>;
  abstract markCancelled(id: string, at: Date): Promise<Sale | null>;
}
