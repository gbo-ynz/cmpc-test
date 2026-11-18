import {
  runAgainst,
  startTestDatabase,
  type TestDatabase,
} from '../../../test-utils/postgres-container';

const SEED_BOOKS = 23;

describe('prisma/seed.js (PostgreSQL)', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
  });

  afterAll(() => db.stop());

  const seed = () => runAgainst(db.url, 'node', ['prisma/seed.js']);
  const counts = async () => ({
    books: await db.prisma.book.count(),
    users: await db.prisma.user.count(),
    genres: await db.prisma.genre.count(),
  });

  it('loads the admin user and the demo catalog into an empty database', async () => {
    seed();

    expect(await counts()).toEqual({ books: SEED_BOOKS, users: 1, genres: 8 });
  });

  it('is idempotent: running it again changes nothing', async () => {
    const before = await db.prisma.book.findMany({ orderBy: { id: 'asc' } });

    seed();

    expect(await counts()).toEqual({ books: SEED_BOOKS, users: 1, genres: 8 });
    expect(await db.prisma.book.findMany({ orderBy: { id: 'asc' } })).toEqual(before);
  });

  it('never overwrites existing data: a database with books is left untouched', async () => {
    await db.prisma.book.deleteMany({ where: { title: { not: 'Rayuela' } } });

    seed();

    expect(await db.prisma.book.count()).toBe(1);
  });
});
