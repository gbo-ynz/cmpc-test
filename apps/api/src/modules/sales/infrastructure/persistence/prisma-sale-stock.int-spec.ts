import { PrismaTransactionManager } from '../../../../shared/infrastructure/prisma/prisma-transaction-manager';
import { FakeAuditLogger } from '../../../../test-utils/fakes';
import { startSalesDatabase } from '../../../../test-utils/sales-fixtures';
import { CompleteSaleUseCase } from '../../application/complete-sale.use-case';
import { InsufficientStockError } from '../../domain/sale.errors';
import { PrismaSaleStock } from './prisma-sale-stock';
import { PrismaSaleRepository } from './prisma-sale.repository';

// The tests run in order and share the database.
let env: Awaited<ReturnType<typeof startSalesDatabase>>;
let stock: PrismaSaleStock;

beforeAll(async () => {
  env = await startSalesDatabase();
  stock = new PrismaSaleStock(env.prisma);
});

afterAll(() => env.stop());

const stockOf = async (id: string) =>
  (await env.db.prisma.book.findUniqueOrThrow({ where: { id } })).stock;

it('never lets concurrent discounts leave negative stock', async () => {
  const book = await env.addBook('Último ejemplar', 1);

  const results = await Promise.all([stock.decrement(book.id, 1), stock.decrement(book.id, 1)]);

  expect(results.sort()).toEqual([false, true]);
  expect(await stockOf(book.id)).toBe(0);
});

it('does not see or discount deleted books', async () => {
  const gone = await env.addBook('Eliminado', 5, new Date());

  expect(await stock.findSellable([gone.id])).toEqual([]);
  expect(await stock.decrement(gone.id, 1)).toBe(false);
});

it('rolls everything back when a later line has no stock: nothing is discounted', async () => {
  const sales = new PrismaSaleRepository(env.prisma);
  const plenty = await env.addBook('Con stock', 5);
  const short = await env.addBook('Sin stock', 1);
  const lines = [
    { bookId: plenty.id, quantity: 2, unitPrice: 1000 },
    { bookId: short.id, quantity: 1, unitPrice: 1000 },
  ];
  const sale = await sales.create({ createdById: env.userId, total: 3000, items: lines });
  await env.db.prisma.book.update({ where: { id: short.id }, data: { stock: 0 } });
  const transactions = new PrismaTransactionManager(env.prisma);
  const complete = new CompleteSaleUseCase(sales, stock, transactions, new FakeAuditLogger());

  const attempt = complete.execute({ id: sale.id, paymentMethod: 'CASH', actorId: env.userId });

  await expect(attempt).rejects.toThrow(InsufficientStockError);
  expect(await stockOf(plenty.id)).toBe(5);
  expect((await sales.findById(sale.id))?.status).toBe('PENDING');
});
