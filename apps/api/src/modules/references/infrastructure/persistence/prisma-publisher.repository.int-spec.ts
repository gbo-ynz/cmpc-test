import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { addBook } from '../../../../test-utils/db-fixtures';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { NO_PUBLISHER_DETAILS } from '../../domain/publisher';
import { PrismaPublisherRepository } from './prisma-publisher.repository';

// The tests run in order and share the database.
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaPublisherRepository;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaPublisherRepository(prisma);
  await addBook(db.prisma, { author: 'Borges', publisher: 'Sur', genre: 'Cuento' });
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

it('creates a publisher with country and reads it back', async () => {
  const created = await repository.create('Losada', { country: 'Argentina' });

  expect(await repository.findById(created.id)).toEqual(created);
  expect(await repository.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
});

it('lists publishers sorted by name with country and active books', async () => {
  expect(await repository.list()).toEqual([
    expect.objectContaining({ name: 'Losada', country: 'Argentina', activeBooks: 0 }),
    expect.objectContaining({ name: 'Sur', country: null, activeBooks: 1 }),
  ]);
});

it('pages publishers on the database, sorted by name, with the total', async () => {
  const first = await repository.listPage({ page: 1, limit: 1 });
  const second = await repository.listPage({ page: 2, limit: 1 });

  expect(first.items.map((publisher) => publisher.name)).toEqual(['Losada']);
  expect(second.items[0]).toEqual(expect.objectContaining({ name: 'Sur', activeBooks: 1 }));
  expect(second.meta).toEqual({ total: 2, page: 2, limit: 1, totalPages: 2 });
});

it('updates name and country, clearing the country with null', async () => {
  const [losada] = await repository.list();

  const updated = await repository.update(losada.id, 'Editorial Losada', NO_PUBLISHER_DETAILS);

  expect(updated).toEqual({ id: losada.id, name: 'Editorial Losada', country: null });
});
