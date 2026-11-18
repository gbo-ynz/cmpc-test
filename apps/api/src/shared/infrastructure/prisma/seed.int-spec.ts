import { seedCounts } from '../../../test-utils/db-fixtures';
import {
  runAgainst,
  startTestDatabase,
  type TestDatabase,
} from '../../../test-utils/postgres-container';

// prisma/seed.js against an empty PostgreSQL. The tests run in order and share the database.
const EXPECTED = { books: 23, users: 2, genres: 8 };
const OUT_OF_STOCK_BOOKS = 5;
let db: TestDatabase;
const seed = () => runAgainst(db.url, 'node', ['prisma/seed.js']);
const usersByRole = () =>
  db.prisma.user.findMany({ select: { email: true, role: true }, orderBy: { email: 'asc' } });

beforeAll(async () => {
  db = await startTestDatabase();
});

afterAll(() => db.stop());

it('loads one user per role and the demo catalog into an empty database', async () => {
  seed();

  expect(await seedCounts(db.prisma)).toEqual(EXPECTED);
  expect(await usersByRole()).toEqual([
    { email: 'admin@cmpc.cl', role: 'ADMIN' },
    { email: 'usuario@cmpc.cl', role: 'USER' },
  ]);
});

it('loads stock for every book, some of them out of stock', async () => {
  const books = await db.prisma.book.findMany({ select: { stock: true } });

  expect(books.filter((book) => book.stock === 0)).toHaveLength(OUT_OF_STOCK_BOOKS);
  expect(books.every((book) => book.stock >= 0)).toBe(true);
});

it('is idempotent: running it again changes nothing', async () => {
  const before = await db.prisma.book.findMany({ orderBy: { id: 'asc' } });

  seed();

  expect(await seedCounts(db.prisma)).toEqual(EXPECTED);
  expect(await db.prisma.book.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
});

it('never overwrites existing data: a database with books is left untouched', async () => {
  await db.prisma.book.deleteMany({ where: { title: { not: 'Rayuela' } } });

  seed();

  expect(await db.prisma.book.count()).toBe(1);
});
