import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { addBook } from '../../../../test-utils/db-fixtures';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { NO_GENRE_DETAILS } from '../../domain/genre';
import { PrismaGenreRepository } from './prisma-genre.repository';

// The tests run in order and share the database.
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaGenreRepository;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaGenreRepository(prisma);
  await addBook(db.prisma, { author: 'Borges', publisher: 'Sur', genre: 'Cuento' });
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

it('creates a genre with description and reads it back', async () => {
  const created = await repository.create('Ensayo', {
    description: 'Textos de reflexión.\nVoz personal.',
  });

  expect(await repository.findById(created.id)).toEqual(created);
  expect(await repository.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
});

it('lists genres sorted by name with description and active books', async () => {
  expect(await repository.list()).toEqual([
    expect.objectContaining({ name: 'Cuento', description: null, activeBooks: 1 }),
    expect.objectContaining({ name: 'Ensayo', activeBooks: 0 }),
  ]);
});

it('pages genres on the database, sorted by name, with the total', async () => {
  const first = await repository.listPage({ page: 1, limit: 1 });
  const second = await repository.listPage({ page: 2, limit: 1 });

  expect(first.items[0]).toEqual(expect.objectContaining({ name: 'Cuento', activeBooks: 1 }));
  expect(second.items.map((genre) => genre.name)).toEqual(['Ensayo']);
  expect(second.meta).toEqual({ total: 2, page: 2, limit: 1, totalPages: 2 });
});

it('updates name and description, clearing the description with null', async () => {
  const [, essay] = await repository.list();

  const updated = await repository.update(essay.id, 'Ensayo literario', NO_GENRE_DETAILS);

  expect(updated).toEqual({ id: essay.id, name: 'Ensayo literario', description: null });
});
