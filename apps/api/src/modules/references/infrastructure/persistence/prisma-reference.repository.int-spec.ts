import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { addBook } from '../../../../test-utils/db-fixtures';
import { startTestDatabase, type TestDatabase } from '../../../../test-utils/postgres-container';
import { PrismaReferenceRepository } from './prisma-reference.repository';

// The tests run in order and share the database.
let db: TestDatabase;
let prisma: PrismaService;
let repository: PrismaReferenceRepository;

beforeAll(async () => {
  db = await startTestDatabase();
  process.env.DATABASE_URL = db.url;
  prisma = new PrismaService();
  repository = new PrismaReferenceRepository(prisma);
  await addBook(db.prisma, { author: 'Borges', publisher: 'Sur', genre: 'Cuento' });
  await addBook(db.prisma, { author: 'Sabato', publisher: 'Sur', genre: 'Novela' }, new Date());
});

afterAll(async () => {
  await prisma.onModuleDestroy();
  await db.stop();
});

it('finds names ignoring case', async () => {
  expect(await repository.findByName('genres', 'cUENTO')).toMatchObject({ name: 'Cuento' });
  expect(await repository.findByName('genres', 'Poesía')).toBeNull();
});

it('counts books including soft-deleted ones', async () => {
  const sabato = await repository.findByName('authors', 'Sabato');

  expect(await repository.countBooks('authors', sabato!.id)).toBe(1);
});

it('deletes a record without books', async () => {
  const created = await db.prisma.genre.create({ data: { name: 'Poesía' } });

  await repository.delete('genres', created.id);

  expect(await repository.findById('genres', created.id)).toBeNull();
});
