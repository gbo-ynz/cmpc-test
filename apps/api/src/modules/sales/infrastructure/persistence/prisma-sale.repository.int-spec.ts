import { startSalesDatabase } from '../../../../test-utils/sales-fixtures';
import { PrismaSaleRepository } from './prisma-sale.repository';

// The tests run in order and share the database.
let env: Awaited<ReturnType<typeof startSalesDatabase>>;
let sales: PrismaSaleRepository;

beforeAll(async () => {
  env = await startSalesDatabase();
  sales = new PrismaSaleRepository(env.prisma);
});

afterAll(() => env.stop());

const newSale = (...lines: Array<{ bookId: string; quantity: number }>) =>
  sales.create({
    createdById: env.userId,
    total: 1000 * lines.reduce((sum, line) => sum + line.quantity, 0),
    items: lines.map((line) => ({ ...line, unitPrice: 1000 })),
  });

it('creates a pending sale and reads it back with its lines and creator', async () => {
  const book = await env.addBook('Rayuela', 5);

  const created = await newSale({ bookId: book.id, quantity: 2 });
  const found = await sales.findById(created.id);

  expect(found).toMatchObject({ status: 'PENDING', total: 2000, createdBy: { name: 'Vendedora' } });
  expect(found?.items).toEqual([
    { bookId: book.id, title: 'Rayuela', quantity: 2, unitPrice: 1000 },
  ]);
});

it('lists newest first, one page at a time, filtered by status', async () => {
  const book = await env.addBook('Ficciones', 9);
  const older = await newSale({ bookId: book.id, quantity: 1 });
  const newer = await newSale({ bookId: book.id, quantity: 1 });
  await sales.markCancelled(older.id, new Date());

  const page = await sales.listPage({ page: 1, limit: 2 });
  const cancelled = await sales.listPage({ page: 1, limit: 10 }, 'CANCELLED');

  expect(page.items[0].id).toBe(newer.id);
  expect(page.meta.total).toBeGreaterThanOrEqual(3);
  expect(cancelled.items.map((sale) => sale.id)).toEqual([older.id]);
});

it('only moves a pending sale: the second transition finds nothing to do', async () => {
  const book = await env.addBook('Bestiario', 3);
  const sale = await newSale({ bookId: book.id, quantity: 1 });

  const first = await sales.markCompleted(sale.id, 'CASH', new Date());
  const second = await sales.markCompleted(sale.id, 'TRANSFER', new Date());

  expect(first).toMatchObject({ status: 'COMPLETED', paymentMethod: 'CASH' });
  expect(second).toBeNull();
  expect(await sales.markCancelled(sale.id, new Date())).toBeNull();
});

it('counts the units of the sale in the list, not the distinct books', async () => {
  const a = await env.addBook('Dos unidades', 9);
  const b = await env.addBook('Una unidad', 9);
  const created = await newSale({ bookId: a.id, quantity: 2 }, { bookId: b.id, quantity: 1 });

  const { items } = await sales.listPage({ page: 1, limit: 50 });

  expect(items.find((sale) => sale.id === created.id)?.unitCount).toBe(3);
  expect((await sales.findById(created.id))?.unitCount).toBe(3);
});
