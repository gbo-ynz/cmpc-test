import { startTestDatabase, type TestDatabase } from '../../../test-utils/postgres-container';
import { planOf } from '../../../test-utils/query-plan';

// 2,000 books (a third with stock) and 2,000 sales, then ANALYZE: the planner decides with
// realistic statistics. Like in a real shop, few sales are pending (2%): with a third of them, walking
// the date index and filtering would be just as cheap. One statement per call.
const REPRESENTATIVE_DATA = [
  `INSERT INTO users (id, email, name, password_hash, updated_at) VALUES (gen_random_uuid(), 'v@cmpc.cl', 'V', 'h', now())`,
  `INSERT INTO authors (id, name) VALUES (gen_random_uuid(), 'Autor')`,
  `INSERT INTO publishers (id, name) VALUES (gen_random_uuid(), 'Editorial')`,
  `INSERT INTO genres (id, name) VALUES (gen_random_uuid(), 'Novela')`,
  `INSERT INTO books (id, title, price, stock, author_id, publisher_id, genre_id, updated_at)
     SELECT gen_random_uuid(), 'Libro ' || i, 1000, i % 3,
            (SELECT id FROM authors), (SELECT id FROM publishers), (SELECT id FROM genres), now()
     FROM generate_series(1, 2000) i`,
  `INSERT INTO sales (id, status, payment_method, total, created_by_id, completed_at, cancelled_at, created_at, updated_at)
     SELECT gen_random_uuid(), s::"SaleStatus",
            CASE WHEN s = 'COMPLETED' THEN 'CASH'::"PaymentMethod" END, 1000, (SELECT id FROM users),
            CASE WHEN s = 'COMPLETED' THEN now() END, CASE WHEN s = 'CANCELLED' THEN now() END,
            now() - (i || ' minutes')::interval, now()
     FROM (SELECT i, CASE WHEN i % 50 = 0 THEN 'PENDING' WHEN i % 2 = 0 THEN 'COMPLETED' ELSE 'CANCELLED' END AS s
           FROM generate_series(1, 2000) i) t`,
  'ANALYZE books',
  'ANALYZE sales',
];

describe('sales and availability indexes (PostgreSQL)', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
    for (const statement of REPRESENTATIVE_DATA) await db.prisma.$executeRawUnsafe(statement);
  });

  afterAll(() => db.stop());

  it('serves "pending sales, newest first" (the filtered sales list) with the status index', async () => {
    const sql = `SELECT id FROM sales WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 10`;

    expect(await planOf(db.prisma, sql)).toContain('sales_status_created_at_idx');
  });

  it('serves "newest sales" (the unfiltered list) with the date index', async () => {
    const sql = `SELECT id FROM sales ORDER BY created_at DESC LIMIT 10`;

    expect(await planOf(db.prisma, sql)).toContain('sales_created_at_idx');
  });

  it('serves "active books with stock" (availability filter, sale book picker) with its index', async () => {
    const sql = `SELECT id FROM books WHERE deleted_at IS NULL AND stock > 0`;

    expect(await planOf(db.prisma, sql)).toContain('books_deleted_at_stock_idx');
  });
});
