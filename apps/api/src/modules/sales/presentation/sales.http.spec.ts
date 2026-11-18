import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AuditLogger } from '../../../shared/application/audit-logger.port';
import { TransactionManager } from '../../../shared/application/transaction-manager.port';
import { FakeAuditLogger, FakeTransactionManager } from '../../../test-utils/fakes';
import {
  ADMIN,
  REGULAR_USER,
  createHttpApp,
  tokenFor,
  usersById,
} from '../../../test-utils/http-app';
import { InMemorySaleStock } from '../../../test-utils/in-memory-sale-stock';
import { InMemorySaleRepository } from '../../../test-utils/in-memory-sale.repository';
import type { User } from '../../auth/domain/user';
import { SaleStock } from '../domain/sale-stock';
import { SaleRepository } from '../domain/sale.repository';

let app: NestExpressApplication;
let stock: InMemorySaleStock;

beforeEach(async () => {
  stock = new InMemorySaleStock();
  app = await createHttpApp(usersById(ADMIN, REGULAR_USER), {
    overrides: [
      { provide: SaleRepository, useValue: new InMemorySaleRepository(stock) },
      { provide: SaleStock, useValue: stock },
      { provide: TransactionManager, useValue: new FakeTransactionManager() },
      { provide: AuditLogger, useValue: new FakeAuditLogger() },
    ],
  });
});

afterEach(() => app.close());

async function as(user: User) {
  const auth = { Authorization: `Bearer ${await tokenFor(app, user)}` };
  const server = app.getHttpServer();
  return {
    get: (path: string) => request(server).get(`/api${path}`).set(auth),
    post: (path: string, body: object = {}) =>
      request(server).post(`/api${path}`).set(auth).send(body),
  };
}

const lines = (...items: Array<{ id: string }>) => ({
  items: items.map((book) => ({ bookId: book.id, quantity: 2 })),
});

describe('permissions', () => {
  it('requires a session but not the administrator profile', async () => {
    await request(app.getHttpServer()).get('/api/sales').expect(401);
    const book = stock.seed();

    const user = await as(REGULAR_USER);

    await user.post('/sales', lines(book)).expect(201);
    await user.get('/sales').expect(200);
  });
});

describe('POST /sales', () => {
  it('creates a pending sale with the snapshot prices and the total', async () => {
    const book = stock.seed({ price: 1500, title: 'Ficciones' });

    const { body } = await (await as(ADMIN)).post('/sales', lines(book)).expect(201);

    expect(body.data).toMatchObject({
      status: 'PENDING',
      total: 3000,
      createdBy: { id: ADMIN.id },
    });
    expect(body.data.items).toEqual([
      { bookId: book.id, title: 'Ficciones', quantity: 2, unitPrice: 1500 },
    ]);
  });

  it('answers 400 for malformed bodies, repeated books, deleted books and too much quantity', async () => {
    const admin = await as(ADMIN);
    const book = stock.seed({ stock: 1 });
    const gone = stock.seed({ deleted: true });

    await admin.post('/sales', { items: [] }).expect(400);
    await admin.post('/sales', { items: [{ bookId: 'nope', quantity: 1 }] }).expect(400);
    await admin.post('/sales', { items: [{ bookId: book.id, quantity: 0 }] }).expect(400);
    await admin.post('/sales', lines(gone)).expect(400);
    await admin.post('/sales', lines(book)).expect(400); // 2 units, 1 in stock
    await admin
      .post('/sales', {
        items: [
          { bookId: book.id, quantity: 1 },
          { bookId: book.id, quantity: 1 },
        ],
      })
      .expect(400);
  });
});

describe('complete and cancel', () => {
  it('completes with a payment method, discounts the stock and then refuses another action', async () => {
    const admin = await as(ADMIN);
    const book = stock.seed({ stock: 5 });
    const { body } = await admin.post('/sales', lines(book));
    const id = body.data.id;

    await admin.post(`/sales/${id}/complete`, {}).expect(400); // the payment method is required
    await admin.post(`/sales/${id}/complete`, { paymentMethod: 'BITCOIN' }).expect(400);
    const done = await admin
      .post(`/sales/${id}/complete`, { paymentMethod: 'TRANSFER' })
      .expect(200);

    expect(done.body.data).toMatchObject({ status: 'COMPLETED', paymentMethod: 'TRANSFER' });
    expect(stock.stockOf(book.id)).toBe(3);
    await admin.post(`/sales/${id}/complete`, { paymentMethod: 'CASH' }).expect(409);
    await admin.post(`/sales/${id}/cancel`).expect(409);
  });

  it('answers 409 when the stock is no longer enough', async () => {
    const admin = await as(ADMIN);
    const book = stock.seed({ stock: 2 });
    const { body } = await admin.post('/sales', lines(book));
    await stock.decrement(book.id, 1);

    await admin.post(`/sales/${body.data.id}/complete`, { paymentMethod: 'CASH' }).expect(409);
  });

  it('cancels a pending sale without touching the stock', async () => {
    const admin = await as(ADMIN);
    const book = stock.seed({ stock: 5 });
    const { body } = await admin.post('/sales', lines(book));

    const cancelled = await admin.post(`/sales/${body.data.id}/cancel`).expect(200);

    expect(cancelled.body.data.status).toBe('CANCELLED');
    expect(stock.stockOf(book.id)).toBe(5);
  });

  it('answers 404 for an unknown sale and 400 for a malformed id', async () => {
    const admin = await as(ADMIN);

    await admin.get('/sales/0a1b2c3d-0000-4000-8000-0000000000ff').expect(404);
    await admin.post('/sales/nope/cancel').expect(400);
  });
});

describe('GET /sales', () => {
  it('paginates on the server and filters by status', async () => {
    const admin = await as(ADMIN);
    const book = stock.seed({ stock: 20 });
    const first = await admin.post('/sales', lines(book));
    await admin.post('/sales', lines(book));
    await admin.post(`/sales/${first.body.data.id}/cancel`);

    const page = await admin.get('/sales?page=1&limit=1').expect(200);
    const pending = await admin.get('/sales?status=PENDING').expect(200);

    expect(page.body.data).toHaveLength(1);
    expect(page.body.meta).toEqual({ total: 2, page: 1, limit: 1, totalPages: 2 });
    expect(pending.body.meta.total).toBe(1);
    await admin.get('/sales?status=LOST').expect(400);
    await admin.get('/sales?limit=500').expect(400);
  });
});
