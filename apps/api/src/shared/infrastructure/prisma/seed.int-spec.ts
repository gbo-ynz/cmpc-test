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

it('loads birth date and biography for every demo author (birth date only when known)', async () => {
  const authors = await db.prisma.author.findMany({ select: { birthDate: true, biography: true } });
  const mistral = await db.prisma.author.findUnique({ where: { name: 'Gabriela Mistral' } });

  expect(authors.every((author) => author.biography !== null)).toBe(true);
  expect(authors.filter((author) => author.birthDate === null)).toHaveLength(2);
  expect(mistral?.birthDate?.toISOString().slice(0, 10)).toBe('1889-04-07');
});

it('loads the country of every demo publisher', async () => {
  const publishers = await db.prisma.publisher.findMany({ select: { country: true } });
  const sur = await db.prisma.publisher.findUnique({ where: { name: 'Sudamericana' } });

  expect(publishers.every((publisher) => publisher.country !== null)).toBe(true);
  expect(sur?.country).toBe('Argentina');
});

it('loads the description of every demo genre', async () => {
  const genres = await db.prisma.genre.findMany({ select: { description: true } });
  const poetry = await db.prisma.genre.findUnique({ where: { name: 'Poesía' } });

  expect(genres.every((genre) => genre.description !== null)).toBe(true);
  expect(poetry?.description).toContain('verso');
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
