import { LEGACY_ROWS, initialMigrationOnly } from '../../../test-utils/db-fixtures';
import {
  runAgainst,
  startTestDatabase,
  type TestDatabase,
} from '../../../test-utils/postgres-container';

// Production scenario: data written with the initial schema, then every later migration applied.
let db: TestDatabase;

beforeAll(async () => {
  db = await startTestDatabase({ migrate: false });
  runAgainst(db.url, 'npx', ['prisma', 'migrate', 'deploy', '--schema', initialMigrationOnly()]);
  for (const statement of LEGACY_ROWS) await db.prisma.$executeRawUnsafe(statement);
  runAgainst(db.url, 'npx', ['prisma', 'migrate', 'deploy']);
});

afterAll(() => db.stop());

it('renames the EDITOR role to USER without losing users', async () => {
  const users = await db.prisma.$queryRaw`SELECT email, role::text AS role, deleted_at FROM users`;

  expect(users).toEqual([{ email: 'editor@cmpc.cl', role: 'USER', deleted_at: null }]);
});

it('backfills the stock from the old availability flag', async () => {
  const books = await db.prisma.$queryRaw`SELECT title, stock FROM books ORDER BY title`;

  expect(books).toEqual([
    { title: 'Agotado', stock: 0 },
    { title: 'Disponible', stock: 1 },
  ]);
});

it('rejects a negative stock at the database level', async () => {
  await expect(db.prisma.$executeRawUnsafe('UPDATE books SET stock = -1')).rejects.toThrow(
    /books_stock_non_negative/,
  );
});

it('creates the sales tables and the new audit actions', async () => {
  const tables = await db.prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_name IN ('sales', 'sale_items') ORDER BY table_name`;
  const actions = await db.prisma.$queryRaw<Array<{ action: string }>>`
    SELECT unnest(enum_range(NULL::"AuditAction"))::text AS action`;

  expect(tables.map((row) => row.table_name)).toEqual(['sale_items', 'sales']);
  expect(actions.map((row) => row.action)).toEqual(expect.arrayContaining(['COMPLETE', 'CANCEL']));
});
