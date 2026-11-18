import { randomUUID } from 'node:crypto';
import { paginate, toSkip, type PageRequest, type Paginated } from '../shared/domain/pagination';
import type {
  NewSale,
  PaymentMethod,
  Sale,
  SaleStatus,
  SaleSummary,
} from '../modules/sales/domain/sale';
import { SaleRepository } from '../modules/sales/domain/sale.repository';
import type { InMemorySaleStock } from './in-memory-sale-stock';

/** Same contract as the Prisma adapter: newest first and conditional PENDING transitions. */
export class InMemorySaleRepository extends SaleRepository {
  private readonly sales: Sale[] = [];
  private clock = 0;

  constructor(private readonly stock: InMemorySaleStock) {
    super();
  }

  async listPage(request: PageRequest, status?: SaleStatus): Promise<Paginated<SaleSummary>> {
    const matching = this.sales.filter((sale) => !status || sale.status === status);
    const newestFirst = [...matching].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const start = toSkip(request);
    return paginate(newestFirst.slice(start, start + request.limit), matching.length, request);
  }

  async findById(id: string): Promise<Sale | null> {
    return this.sales.find((sale) => sale.id === id) ?? null;
  }

  async create({ createdById, total, items }: NewSale): Promise<Sale> {
    this.clock += 1;
    const sale: Sale = {
      id: randomUUID(),
      status: 'PENDING',
      paymentMethod: null,
      total,
      unitCount: items.reduce((units, line) => units + line.quantity, 0),
      createdAt: new Date(2026, 0, 1, 0, 0, this.clock),
      completedAt: null,
      cancelledAt: null,
      createdBy: { id: createdById, name: 'Vendedor' },
      items: items.map((line) => ({ ...line, title: this.stock.titleOf(line.bookId) })),
    };
    this.sales.push(sale);
    return sale;
  }

  async markCompleted(id: string, method: PaymentMethod, at: Date): Promise<Sale | null> {
    return this.closePending(id, { status: 'COMPLETED', paymentMethod: method, completedAt: at });
  }

  async markCancelled(id: string, at: Date): Promise<Sale | null> {
    return this.closePending(id, { status: 'CANCELLED', cancelledAt: at });
  }

  private closePending(id: string, changes: Partial<Sale>): Sale | null {
    const index = this.sales.findIndex((sale) => sale.id === id && sale.status === 'PENDING');
    if (index === -1) return null;
    this.sales[index] = { ...this.sales[index], ...changes };
    return this.sales[index];
  }
}
