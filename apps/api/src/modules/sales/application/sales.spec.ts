import { ACTOR_ID, FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import { InMemorySaleRepository } from '../../../test-utils/in-memory-sale.repository';
import { InMemorySaleStock } from '../../../test-utils/in-memory-sale-stock';
import {
  InsufficientStockError,
  SaleNotFoundError,
  SaleNotPendingError,
} from '../domain/sale.errors';
import { CancelSaleUseCase } from './cancel-sale.use-case';
import { CompleteSaleUseCase } from './complete-sale.use-case';
import { CreateSaleUseCase } from './create-sale.use-case';
import { GetSaleUseCase, ListSalesPageUseCase } from './sale-queries.use-case';

let stock: InMemorySaleStock;
let sales: InMemorySaleRepository;
let audit: FakeAuditLogger;
let create: CreateSaleUseCase;
let complete: CompleteSaleUseCase;
let cancel: CancelSaleUseCase;

beforeEach(() => {
  stock = new InMemorySaleStock();
  sales = new InMemorySaleRepository(stock);
  audit = new FakeAuditLogger();
  const transactions = new FakeTransactionManager();
  create = new CreateSaleUseCase(sales, stock, transactions, audit);
  complete = new CompleteSaleUseCase(sales, stock, transactions, audit);
  cancel = new CancelSaleUseCase(sales, transactions, audit);
});

const sell = (...lines: Array<{ bookId: string; quantity: number }>) =>
  create.execute({ items: lines, actorId: ACTOR_ID });

describe('CreateSaleUseCase', () => {
  it('creates a pending sale with the total, without discounting stock', async () => {
    const book = stock.seed({ price: 2500, stock: 5 });

    const sale = await sell({ bookId: book.id, quantity: 2 });

    expect(sale).toMatchObject({ status: 'PENDING', total: 5000, paymentMethod: null });
    expect(stock.stockOf(book.id)).toBe(5);
    expect(audit.entries[0]).toMatchObject({
      action: 'CREATE',
      entityType: 'Sale',
      entityId: sale.id,
      actorId: ACTOR_ID,
      metadata: { total: 5000, lines: 1 },
    });
  });

  it('rejects a deleted book and does not record anything', async () => {
    const book = stock.seed({ deleted: true });

    await expect(sell({ bookId: book.id, quantity: 1 })).rejects.toThrow('not available');
    expect(audit.entries).toHaveLength(0);
  });
});

describe('CompleteSaleUseCase', () => {
  it('discounts the stock of every line and records the payment method', async () => {
    const a = stock.seed({ stock: 5 });
    const b = stock.seed({ title: 'Ficciones', stock: 3 });
    const sale = await sell({ bookId: a.id, quantity: 2 }, { bookId: b.id, quantity: 3 });

    const done = await complete.execute({ id: sale.id, paymentMethod: 'CASH', actorId: ACTOR_ID });

    expect(done).toMatchObject({ status: 'COMPLETED', paymentMethod: 'CASH' });
    expect(done.completedAt).toBeInstanceOf(Date);
    expect([stock.stockOf(a.id), stock.stockOf(b.id)]).toEqual([3, 0]);
    expect(audit.entries.at(-1)).toMatchObject({
      action: 'COMPLETE',
      metadata: { paymentMethod: 'CASH', total: sale.total },
    });
  });

  it('answers a conflict when a book ran out of stock after the sale was created', async () => {
    const book = stock.seed({ title: 'Rayuela', stock: 2 });
    const sale = await sell({ bookId: book.id, quantity: 2 });
    await stock.decrement(book.id, 1); // someone else sold a unit meanwhile

    await expect(
      complete.execute({ id: sale.id, paymentMethod: 'CASH', actorId: ACTOR_ID }),
    ).rejects.toThrow(InsufficientStockError);
    expect((await sales.findById(sale.id))?.status).toBe('PENDING');
    expect(audit.entries.map((entry) => entry.action)).toEqual(['CREATE']);
  });

  it('answers a conflict when a book was deleted after the sale was created', async () => {
    const book = stock.seed();
    const sale = await sell({ bookId: book.id, quantity: 1 });
    stock.seed({ id: book.id, deleted: true });

    await expect(
      complete.execute({ id: sale.id, paymentMethod: 'CASH', actorId: ACTOR_ID }),
    ).rejects.toThrow(InsufficientStockError);
  });

  it('is final: a completed or cancelled sale cannot change again', async () => {
    const book = stock.seed();
    const done = await sell({ bookId: book.id, quantity: 1 });
    const gone = await sell({ bookId: book.id, quantity: 1 });
    await complete.execute({ id: done.id, paymentMethod: 'DEBIT_CARD', actorId: ACTOR_ID });
    await cancel.execute({ id: gone.id, actorId: ACTOR_ID });

    for (const id of [done.id, gone.id]) {
      await expect(
        complete.execute({ id, paymentMethod: 'CASH', actorId: ACTOR_ID }),
      ).rejects.toThrow(SaleNotPendingError);
      await expect(cancel.execute({ id, actorId: ACTOR_ID })).rejects.toThrow(SaleNotPendingError);
    }
    expect(stock.stockOf(book.id)).toBe(4);
  });

  it('answers not found for an unknown sale', async () => {
    await expect(
      complete.execute({ id: 'nope', paymentMethod: 'CASH', actorId: ACTOR_ID }),
    ).rejects.toThrow(SaleNotFoundError);
  });
});

describe('CancelSaleUseCase', () => {
  it('cancels with the date and leaves the stock alone', async () => {
    const book = stock.seed({ stock: 5 });
    const sale = await sell({ bookId: book.id, quantity: 4 });

    const cancelled = await cancel.execute({ id: sale.id, actorId: ACTOR_ID });

    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelledAt).toBeInstanceOf(Date);
    expect(stock.stockOf(book.id)).toBe(5);
    expect(audit.entries.at(-1)).toMatchObject({ action: 'CANCEL', entityId: sale.id });
  });
});

describe('sale queries', () => {
  it('lists newest first, one page at a time and filtered by status', async () => {
    const book = stock.seed({ stock: 10 });
    const first = await sell({ bookId: book.id, quantity: 1 });
    await sell({ bookId: book.id, quantity: 1 });
    await sell({ bookId: book.id, quantity: 1 });
    await cancel.execute({ id: first.id, actorId: ACTOR_ID });

    const page = await new ListSalesPageUseCase(sales).execute({ page: 1, limit: 2 });
    const cancelled = await new ListSalesPageUseCase(sales).execute(
      { page: 1, limit: 10 },
      'CANCELLED',
    );

    expect(page.items).toHaveLength(2);
    expect(page.items[0].createdAt.getTime()).toBeGreaterThan(page.items[1].createdAt.getTime());
    expect(page.meta).toEqual({ total: 3, page: 1, limit: 2, totalPages: 2 });
    expect(cancelled.items.map((sale) => sale.id)).toEqual([first.id]);
  });

  it('counts units, not distinct books: two copies of one book are 2', async () => {
    const a = stock.seed({ stock: 10 });
    const b = stock.seed({ stock: 10 });
    await sell({ bookId: a.id, quantity: 2 }, { bookId: b.id, quantity: 1 });

    const page = await new ListSalesPageUseCase(sales).execute({ page: 1, limit: 10 });

    expect(page.items[0].unitCount).toBe(3);
  });

  it('returns one sale with its lines, or not found', async () => {
    const book = stock.seed({ title: 'Ficciones' });
    const sale = await sell({ bookId: book.id, quantity: 1 });

    expect((await new GetSaleUseCase(sales).execute(sale.id)).items[0].title).toBe('Ficciones');
    await expect(new GetSaleUseCase(sales).execute('nope')).rejects.toThrow(SaleNotFoundError);
  });
});
