import type { PrismaClient } from '@prisma/client';
import { startTestDatabase, type TestDatabase } from '../../../test-utils/postgres-container';

// The indexes that back the frequent queries (see docs/DATABASE.md). If a migration drops or
// renames one, these tests fail before the slowdown reaches production.
const EXPECTED_BOOK_INDEXES = [
  'books_deleted_at_genre_id_idx',
  'books_deleted_at_publisher_id_idx',
  'books_deleted_at_author_id_idx',
  'books_deleted_at_is_available_idx',
  'books_deleted_at_created_at_idx',
  'books_price_idx',
  'books_title_trgm_idx',
];

// 2,000 books over 20 genres + ANALYZE: the planner decides with realistic statistics.
// One statement per call: PostgreSQL rejects multiple commands in a prepared statement.
const REPRESENTATIVE_DATA = [
  `INSERT INTO authors (id, name) VALUES (gen_random_uuid(), 'Autor')`,
  `INSERT INTO publishers (id, name) VALUES (gen_random_uuid(), 'Editorial')`,
  `INSERT INTO genres (id, name) SELECT gen_random_uuid(), 'Género ' || g FROM generate_series(1, 20) g`,
  `INSERT INTO books (id, title, price, author_id, publisher_id, genre_id, updated_at)
     SELECT gen_random_uuid(), 'Libro ' || i, 1000,
            (SELECT id FROM authors), (SELECT id FROM publishers),
            (SELECT id FROM genres ORDER BY name OFFSET i % 20 LIMIT 1), now()
     FROM generate_series(1, 2000) i`,
  'ANALYZE books',
];

async function seedRepresentativeData(prisma: PrismaClient): Promise<void> {
  for (const statement of REPRESENTATIVE_DATA) await prisma.$executeRawUnsafe(statement);
}

/** EXPLAIN output for a query, with sequential scans discouraged so index choice is visible. */
const planOf = (prisma: PrismaClient, sql: string): Promise<string> =>
  prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off');
    const rows = await tx.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(`EXPLAIN ${sql}`);
    return rows.map((row) => row['QUERY PLAN']).join('\n');
  });

describe('database indexes (PostgreSQL)', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await startTestDatabase();
    await seedRepresentativeData(db.prisma);
  });

  afterAll(() => db.stop());

  it('creates every index the frequent queries rely on', async () => {
    const rows = await db.prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes WHERE tablename = 'books'`;

    expect(rows.map((row) => row.indexname)).toEqual(expect.arrayContaining(EXPECTED_BOOK_INDEXES));
  });

  it('serves the case-insensitive title search with the trigram index', async () => {
    expect(await planOf(db.prisma, `SELECT id FROM books WHERE title ILIKE '%libro 1%'`)).toContain(
      'books_title_trgm_idx',
    );
  });

  it('serves "active books of a genre" (filters and catalog) with the composite index', async () => {
    const genre = `(SELECT id FROM genres WHERE name = 'Género 7')`;
    const sql = `SELECT id FROM books WHERE deleted_at IS NULL AND genre_id = ${genre}`;

    expect(await planOf(db.prisma, sql)).toContain('books_deleted_at_genre_id_idx');
  });
});
