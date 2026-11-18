import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { addBook } from '../../../../test-utils/db-fixtures';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { NO_DETAILS } from '../../domain/author';
import { PrismaAuthorRepository } from './prisma-author.repository';

// The tests run in order and share the database.
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaAuthorRepository;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaAuthorRepository(prisma);
  await addBook(db.prisma, { author: 'Borges', publisher: 'Sur', genre: 'Cuento' });
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

it('stores the birth date as a calendar day (no time-zone shift) and the biography as is', async () => {
  const created = await repository.create('Gabriela Mistral', {
    birthDate: '1889-04-07',
    biography: 'Poeta.\nNobel 1945.',
  });

  const [row] = await db.prisma.$queryRaw<Array<{ birth_date: string }>>`
    SELECT birth_date::text AS birth_date FROM authors WHERE id = ${created.id}::uuid`;
  expect(row.birth_date).toBe('1889-04-07');
  expect(await repository.findById(created.id)).toEqual(created);
});

it('lists authors sorted by name with details and active books', async () => {
  expect(await repository.list()).toEqual([
    expect.objectContaining({ name: 'Borges', birthDate: null, biography: null, activeBooks: 1 }),
    expect.objectContaining({ name: 'Gabriela Mistral', birthDate: '1889-04-07', activeBooks: 0 }),
  ]);
});

it('pages authors on the database, sorted by name, with the total', async () => {
  const first = await repository.listPage({ page: 1, limit: 1 });
  const second = await repository.listPage({ page: 2, limit: 1 });

  expect(first.items.map((author) => author.name)).toEqual(['Borges']);
  expect(first.items[0]).toEqual(expect.objectContaining({ activeBooks: 1 }));
  expect(second.items.map((author) => author.name)).toEqual(['Gabriela Mistral']);
  expect(second.meta).toEqual({ total: 2, page: 2, limit: 1, totalPages: 2 });
});

it('updates name and details, clearing them with null', async () => {
  const [, mistral] = await repository.list();

  const updated = await repository.update(mistral.id, 'Lucila Godoy', NO_DETAILS);

  expect(updated).toEqual({ id: mistral.id, name: 'Lucila Godoy', ...NO_DETAILS });
  expect(await repository.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
});
